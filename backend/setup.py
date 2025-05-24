from setuptools import setup, find_packages

setup(
    name="healthcare-ivr-platform",
    version="0.1.0",
    packages=find_packages(),
    install_requires=[
        "requests>=2.31.0",
        "redis>=5.0.1",
        "boto3>=1.34.0",
    ],
) 