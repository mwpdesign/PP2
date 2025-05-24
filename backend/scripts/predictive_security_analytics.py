#!/usr/bin/env python3
"""
Predictive Security Analytics for Healthcare IVR Platform.
Uses machine learning to predict and prevent security incidents.
"""

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
import joblib
import boto3
import json
import logging
import argparse
from datetime import datetime, timedelta
from typing import Dict, Any, List
from security_validator import SecurityConfigValidator
from compliance_checker import HIPAAComplianceChecker

logger = logging.getLogger('predictive_security')

class PredictiveSecurityAnalytics:
    def __init__(self, environment: str):
        self.environment = environment
        self.cloudwatch = boto3.client('cloudwatch')
        self.securityhub = boto3.client('securityhub')
        self.security_validator = SecurityConfigValidator(environment)
        self.compliance_checker = HIPAAComplianceChecker(environment)
        
        # Initialize model paths
        self.model_path = f'models/{environment}_security_model.joblib'
        self.scaler_path = f'models/{environment}_scaler.joblib'
        
    def collect_security_data(self, days_back: int = 90) -> pd.DataFrame:
        """
        Collect comprehensive security and compliance data
        """
        logger.info(f"Collecting security data for past {days_back} days")
        
        # Collect CloudWatch metrics
        cloudwatch_metrics = self._fetch_cloudwatch_metrics(days_back)
        
        # Collect SecurityHub findings
        security_findings = self._fetch_security_findings(days_back)
        
        # Get current security validation
        security_validation = self.security_validator.validate()
        security_validation_df = pd.DataFrame(
            [self._flatten_dict(security_validation)]
        )
        
        # Get current compliance status
        compliance_status = self.compliance_checker.validate()
        compliance_df = pd.DataFrame(
            [self._flatten_dict(compliance_status)]
        )
        
        # Merge all data sources
        merged_data = pd.concat([
            cloudwatch_metrics,
            security_findings,
            security_validation_df,
            compliance_df
        ], axis=1)
        
        return self._preprocess_data(merged_data)

    def _fetch_cloudwatch_metrics(self, days_back: int) -> pd.DataFrame:
        """
        Retrieve security-related CloudWatch metrics
        """
        end_time = datetime.now()
        start_time = end_time - timedelta(days=days_back)
        
        metrics_to_collect = [
            {
                'Namespace': 'AWS/SecurityHub',
                'MetricName': 'SecurityFindingCount',
                'Dimensions': [
                    {'Name': 'Severity', 'Value': 'CRITICAL'}
                ]
            },
            {
                'Namespace': 'AWS/WAF',
                'MetricName': 'BlockedRequests',
                'Dimensions': [
                    {'Name': 'WebACL', 'Value': f'{self.environment}-waf'}
                ]
            },
            {
                'Namespace': 'AWS/GuardDuty',
                'MetricName': 'FindingCount',
                'Dimensions': [
                    {'Name': 'Severity', 'Value': 'High'}
                ]
            }
        ]
        
        collected_metrics = []
        for metric in metrics_to_collect:
            try:
                response = self.cloudwatch.get_metric_statistics(
                    Namespace=metric['Namespace'],
                    MetricName=metric['MetricName'],
                    Dimensions=metric['Dimensions'],
                    StartTime=start_time,
                    EndTime=end_time,
                    Period=3600,
                    Statistics=['Average', 'Maximum', 'Sum']
                )
                
                metric_df = pd.DataFrame(response['Datapoints'])
                metric_df['MetricName'] = metric['MetricName']
                collected_metrics.append(metric_df)
            except Exception as e:
                logger.error(
                    f"Error collecting metric {metric['MetricName']}: {str(e)}"
                )
        
        return (
            pd.concat(collected_metrics) 
            if collected_metrics 
            else pd.DataFrame()
        )

    def _fetch_security_findings(self, days_back: int) -> pd.DataFrame:
        """
        Retrieve and analyze SecurityHub findings
        """
        try:
            end_time = datetime.now()
            start_time = end_time - timedelta(days=days_back)
            
            filters = {
                'RecordState': [
                    {'Value': 'ACTIVE', 'Comparison': 'EQUALS'}
                ],
                'WorkflowStatus': [
                    {'Value': 'NEW', 'Comparison': 'EQUALS'}
                ],
                'FirstObservedAt': [
                    {
                        'Start': start_time.isoformat(),
                        'End': end_time.isoformat()
                    }
                ]
            }
            
            response = self.securityhub.get_findings(Filters=filters)
            findings_df = pd.DataFrame(response['Findings'])
            
            # Extract relevant security features
            security_features = findings_df.apply(
                self._extract_security_features, 
                axis=1
            )
            
            return security_features
            
        except Exception as e:
            logger.error(f"Error fetching security findings: {str(e)}")
            return pd.DataFrame()

    def _extract_security_features(self, finding: pd.Series) -> pd.Series:
        """
        Extract meaningful security features from findings
        """
        severity = finding.get('Severity', {})
        resources = finding.get('Resources', [{}])
        compliance = finding.get('Compliance', {})
        
        return pd.Series({
            'severity_critical': severity.get('Label') == 'CRITICAL',
            'severity_high': severity.get('Label') == 'HIGH',
            'resource_type': resources[0].get('Type', 'UNKNOWN'),
            'compliance_status': compliance.get('Status', 'UNKNOWN'),
            'finding_type': finding.get('Type', 'UNKNOWN'),
            'is_phi_related': (
                'PHI' in finding.get('Title', '') or 
                'PHI' in finding.get('Description', '')
            )
        })

    def _preprocess_data(self, data: pd.DataFrame) -> pd.DataFrame:
        """
        Preprocess collected data for model training/prediction
        """
        # Handle missing values
        data = data.fillna(0)
        
        # Convert categorical variables
        categorical_columns = data.select_dtypes(include=['object']).columns
        for col in categorical_columns:
            data[col] = pd.Categorical(data[col]).codes
        
        return data

    def _flatten_dict(self, d: Dict, parent_key: str = '', sep: str = '_') -> Dict:
        """
        Flatten nested dictionary for DataFrame conversion
        """
        items = []
        for k, v in d.items():
            new_key = f"{parent_key}{sep}{k}" if parent_key else k
            if isinstance(v, dict):
                items.extend(self._flatten_dict(v, new_key, sep).items())
            else:
                items.append((new_key, v))
        return dict(items)

    def train_predictive_model(self, training_data: pd.DataFrame):
        """
        Train machine learning model for security prediction
        """
        logger.info("Training predictive security model")
        
        try:
            # Prepare features and target
            features = training_data.drop('security_incident', axis=1)
            target = training_data['security_incident']
            
            # Preprocess data
            scaler = StandardScaler()
            X_scaled = scaler.fit_transform(features)
            
            # Split data
            X_train, X_test, y_train, y_test = train_test_split(
                X_scaled, target, test_size=0.2, random_state=42
            )
            
            # Train Random Forest model
            model = RandomForestClassifier(
                n_estimators=100,
                max_depth=10,
                min_samples_split=5,
                random_state=42
            )
            model.fit(X_train, y_train)
            
            # Evaluate model
            train_score = model.score(X_train, y_train)
            test_score = model.score(X_test, y_test)
            
            logger.info(f"Model training complete. Train score: {train_score:.3f}, Test score: {test_score:.3f}")
            
            # Save model and scaler
            joblib.dump(model, self.model_path)
            joblib.dump(scaler, self.scaler_path)
            
            return {
                'train_accuracy': train_score,
                'test_accuracy': test_score,
                'feature_importances': dict(zip(features.columns, model.feature_importances_))
            }
            
        except Exception as e:
            logger.error(f"Error training predictive model: {str(e)}")
            raise

    def predict_security_risks(self, input_data: pd.DataFrame) -> Dict[str, Any]:
        """
        Predict potential security risks
        """
        try:
            # Load saved model and scaler
            model = joblib.load(self.model_path)
            scaler = joblib.load(self.scaler_path)
            
            # Preprocess input data
            input_scaled = scaler.transform(input_data)
            
            # Make predictions
            risk_probabilities = model.predict_proba(input_scaled)
            
            # Analyze feature importance for high-risk predictions
            high_risk_factors = self._identify_high_risk_factors(
                model, input_data, risk_probabilities
            )
            
            return {
                'risk_probabilities': risk_probabilities.tolist(),
                'high_risk_factors': high_risk_factors,
                'prediction_timestamp': datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error predicting security risks: {str(e)}")
            return {
                'error': str(e),
                'timestamp': datetime.utcnow().isoformat()
            }

    def _identify_high_risk_factors(
        self, 
        model: RandomForestClassifier,
        data: pd.DataFrame,
        predictions: np.ndarray
    ) -> List[Dict[str, Any]]:
        """
        Identify specific high-risk security factors
        """
        high_risk_factors = []
        
        # Get feature importance
        feature_importance = dict(zip(data.columns, model.feature_importances_))
        
        # Identify top contributing features for high-risk predictions
        high_risk_indices = np.where(predictions[:, 1] > 0.7)[0]
        
        for idx in high_risk_indices:
            contributing_features = []
            for feature, importance in feature_importance.items():
                if importance > 0.1 and data.iloc[idx][feature] > data[feature].mean():
                    contributing_features.append({
                        'feature': feature,
                        'importance': float(importance),
                        'value': float(data.iloc[idx][feature]),
                        'mean_value': float(data[feature].mean())
                    })
            
            high_risk_factors.append({
                'prediction_index': int(idx),
                'risk_probability': float(predictions[idx, 1]),
                'contributing_factors': contributing_features
            })
        
        return high_risk_factors

def main():
    # Configure logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    # Parse arguments
    parser = argparse.ArgumentParser(description='Predictive Security Analytics')
    parser.add_argument('--environment', default='prod',
                      choices=['dev', 'staging', 'prod'],
                      help='Environment to analyze')
    parser.add_argument('--mode', choices=['train', 'predict'], 
                      default='predict',
                      help='Mode of operation')
    parser.add_argument('--days-back', type=int, default=90,
                      help='Number of days of historical data to analyze')
    
    args = parser.parse_args()

    try:
        # Initialize analytics
        security_analytics = PredictiveSecurityAnalytics(args.environment)
        
        if args.mode == 'train':
            # Collect training data
            logger.info("Collecting training data...")
            training_data = security_analytics.collect_security_data(
                days_back=args.days_back
            )
            
            # Train predictive model
            logger.info("Training predictive model...")
            training_results = security_analytics.train_predictive_model(training_data)
            
            print("\nModel Training Results:")
            print(json.dumps(training_results, indent=2))
            
        else:
            # Collect current security data
            logger.info("Collecting current security data...")
            current_data = security_analytics.collect_security_data(
                days_back=args.days_back
            )
            
            # Predict security risks
            logger.info("Predicting security risks...")
            risk_predictions = security_analytics.predict_security_risks(current_data)
            
            print("\nSecurity Risk Predictions:")
            print(json.dumps(risk_predictions, indent=2))

    except Exception as e:
        logger.error(f"Error in main execution: {str(e)}")
        raise

if __name__ == '__main__':
    main() 