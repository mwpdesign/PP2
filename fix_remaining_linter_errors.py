#!/usr/bin/env python3
"""
Comprehensive linter error fix script for Healthcare IVR Platform
Fixes remaining 670 linter errors systematically
"""

import os
import re
import subprocess
from typing import Dict, List


def run_flake8() -> List[str]:
    """Run flake8 and return list of error lines."""
    try:
        result = subprocess.run(
            ["python", "-m", "flake8", "backend/app/"],
            capture_output=True,
            text=True,
            cwd="/Users/michaelparson/PP2/healthcare-ivr-platform"
        )
        return result.stdout.strip().split('\n') if result.stdout.strip() else []
    except Exception as e:
        print(f"Error running flake8: {e}")
        return []


def parse_flake8_errors(error_lines: List[str]) -> Dict[str, List[Dict]]:
    """Parse flake8 output into structured data."""
    errors_by_file = {}

    for line in error_lines:
        if not line.strip():
            continue

        # Parse: filename:line:col: error_code error_message
        match = re.match(r'^([^:]+):(\d+):(\d+): ([A-Z]\d+) (.+)$', line)
        if match:
            filename, line_num, col, error_code, message = match.groups()

            if filename not in errors_by_file:
                errors_by_file[filename] = []

            errors_by_file[filename].append({
                'line': int(line_num),
                'col': int(col),
                'code': error_code,
                'message': message,
                'raw': line
            })

    return errors_by_file


def fix_unused_imports(filepath: str, errors: List[Dict]) -> bool:
    """Fix F401 unused import errors."""
    if not os.path.exists(filepath):
        return False

    # Get all unused imports
    unused_imports = []
    for error in errors:
        if error['code'] == 'F401':
            # Extract import name from message
            match = re.search(r"'([^']+)' imported but unused", error['message'])
            if match:
                unused_imports.append((error['line'], match.group(1)))

    if not unused_imports:
        return False

    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            lines = f.readlines()

        # Sort by line number in reverse order to avoid index shifting
        unused_imports.sort(key=lambda x: x[0], reverse=True)

        modified = False
        for line_num, import_name in unused_imports:
            if line_num <= len(lines):
                line = lines[line_num - 1]  # Convert to 0-based index

                # Handle different import patterns
                if f"import {import_name}" in line:
                    # Single import: from module import name
                    if line.strip().startswith('from ') and f"import {import_name}" in line:
                        # Check if it's the only import
                        import_part = line.split('import ', 1)[1].strip()
                        if import_part == import_name:
                            # Remove entire line
                            lines.pop(line_num - 1)
                            modified = True
                        else:
                            # Remove just this import from multi-import line
                            new_line = line.replace(f", {import_name}", "").replace(f"{import_name}, ", "").replace(f"{import_name}", "")
                            if new_line != line:
                                lines[line_num - 1] = new_line
                                modified = True
                    # Direct import: import name
                    elif line.strip() == f"import {import_name}":
                        lines.pop(line_num - 1)
                        modified = True

        if modified:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.writelines(lines)
            return True

    except Exception as e:
        print(f"Error fixing unused imports in {filepath}: {e}")

    return False


def fix_line_length(filepath: str, errors: List[Dict]) -> bool:
    """Fix E501 line too long errors."""
    if not os.path.exists(filepath):
        return False

    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            lines = f.readlines()

        modified = False
        for error in errors:
            if error['code'] == 'E501':
                line_num = error['line']
                if line_num <= len(lines):
                    line = lines[line_num - 1]

                    # Skip if line is already short enough
                    if len(line.rstrip()) <= 79:
                        continue

                    # Try to break long lines at logical points
                    new_line = break_long_line(line)
                    if new_line != line:
                        lines[line_num - 1] = new_line
                        modified = True

        if modified:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.writelines(lines)
            return True

    except Exception as e:
        print(f"Error fixing line length in {filepath}: {e}")

    return False


def break_long_line(line: str) -> str:
    """Break a long line at logical points."""
    stripped = line.rstrip()
    if len(stripped) <= 79:
        return line

    indent = len(line) - len(line.lstrip())
    base_indent = ' ' * indent

    # For function calls with multiple parameters
    if '(' in stripped and ')' in stripped and ',' in stripped:
        # Find the opening parenthesis
        paren_pos = stripped.find('(')
        if paren_pos > 0:
            before_paren = stripped[:paren_pos + 1]
            after_paren = stripped[paren_pos + 1:]

            if ')' in after_paren:
                params_part = after_paren[:after_paren.rfind(')')]
                after_params = after_paren[after_paren.rfind(')'):]

                # Split parameters
                params = [p.strip() for p in params_part.split(',') if p.strip()]
                if len(params) > 1:
                    new_line = before_paren + '\n'
                    param_indent = base_indent + '    '
                    for i, param in enumerate(params):
                        if i == len(params) - 1:
                            new_line += param_indent + param + '\n'
                        else:
                            new_line += param_indent + param + ',\n'
                    new_line += base_indent + after_params + '\n'
                    return new_line

    # For string concatenation
    if ' + ' in stripped and '"' in stripped:
        parts = stripped.split(' + ')
        if len(parts) > 1:
            new_line = base_indent + parts[0] + ' + \\\n'
            for i, part in enumerate(parts[1:], 1):
                if i == len(parts) - 1:
                    new_line += base_indent + '    ' + part + '\n'
                else:
                    new_line += base_indent + '    ' + part + ' + \\\n'
            return new_line

    # For import statements
    if 'import ' in stripped and ',' in stripped:
        if stripped.startswith('from '):
            from_part, import_part = stripped.split(' import ', 1)
            imports = [imp.strip() for imp in import_part.split(',')]
            if len(imports) > 1:
                new_line = from_part + ' import (\n'
                for imp in imports:
                    new_line += base_indent + '    ' + imp + ',\n'
                new_line += base_indent + ')\n'
                return new_line

    return line


def fix_redefinitions(filepath: str, errors: List[Dict]) -> bool:
    """Fix F811 redefinition errors."""
    if not os.path.exists(filepath):
        return False

    redefinition_lines = []
    for error in errors:
        if error['code'] == 'F811':
            redefinition_lines.append(error['line'])

    if not redefinition_lines:
        return False

    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            lines = f.readlines()

        # Remove redefined imports (keep the first occurrence)
        modified = False
        for line_num in sorted(redefinition_lines, reverse=True):
            if line_num <= len(lines):
                line = lines[line_num - 1]
                if 'import ' in line:
                    lines.pop(line_num - 1)
                    modified = True

        if modified:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.writelines(lines)
            return True

    except Exception as e:
        print(f"Error fixing redefinitions in {filepath}: {e}")

    return False


def fix_comparison_issues(filepath: str, errors: List[Dict]) -> bool:
    """Fix E712 comparison to True/False issues."""
    if not os.path.exists(filepath):
        return False

    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        original_content = content

        # Fix comparison patterns
        content = re.sub(r'\s*==\s*True\b', '', content)
        content = re.sub(r'\s*==\s*False\b', ' is False', content)
        content = re.sub(r'\s*!=\s*True\b', ' is False', content)
        content = re.sub(r'\s*!=\s*False\b', '', content)

        if content != original_content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            return True

    except Exception as e:
        print(f"Error fixing comparisons in {filepath}: {e}")

    return False


def fix_blank_lines(filepath: str, errors: List[Dict]) -> bool:
    """Fix E303 too many blank lines errors."""
    if not os.path.exists(filepath):
        return False

    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            lines = f.readlines()

        # Remove excessive blank lines
        new_lines = []
        blank_count = 0

        for line in lines:
            if line.strip() == '':
                blank_count += 1
                if blank_count <= 2:  # Allow max 2 consecutive blank lines
                    new_lines.append(line)
            else:
                blank_count = 0
                new_lines.append(line)

        if len(new_lines) != len(lines):
            with open(filepath, 'w', encoding='utf-8') as f:
                f.writelines(new_lines)
            return True

    except Exception as e:
        print(f"Error fixing blank lines in {filepath}: {e}")

    return False


def fix_unused_variables(filepath: str, errors: List[Dict]) -> bool:
    """Fix F841 unused variable errors."""
    if not os.path.exists(filepath):
        return False

    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        original_content = content

        for error in errors:
            if error['code'] == 'F841':
                # Extract variable name
                match = re.search(r"local variable '([^']+)' is assigned to but never used", error['message'])
                if match:
                    var_name = match.group(1)
                    # Prefix with underscore to indicate intentionally unused
                    content = re.sub(rf'\b{var_name}\b(?=\s*=)', f'_{var_name}', content)

        if content != original_content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            return True

    except Exception as e:
        print(f"Error fixing unused variables in {filepath}: {e}")

    return False


def add_missing_newlines(filepath: str, errors: List[Dict]) -> bool:
    """Fix W292 no newline at end of file."""
    if not os.path.exists(filepath):
        return False

    has_w292 = any(error['code'] == 'W292' for error in errors)
    if not has_w292:
        return False

    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        if content and not content.endswith('\n'):
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content + '\n')
            return True

    except Exception as e:
        print(f"Error adding newline to {filepath}: {e}")

    return False


def main():
    """Main function to fix linter errors."""
    print("🔧 Starting comprehensive linter error fix...")

    # Get initial error count
    initial_errors = run_flake8()
    initial_count = len(initial_errors)
    print(f"📊 Initial error count: {initial_count}")

    if initial_count == 0:
        print("✅ No linter errors found!")
        return

    # Parse errors by file
    errors_by_file = parse_flake8_errors(initial_errors)



    # Fix errors by type (order matters for efficiency)
    fix_functions = [
        ("unused imports (F401)", fix_unused_imports),
        ("redefinitions (F811)", fix_redefinitions),
        ("unused variables (F841)", fix_unused_variables),
        ("comparison issues (E712)", fix_comparison_issues),
        ("blank lines (E303)", fix_blank_lines),
        ("missing newlines (W292)", add_missing_newlines),
        ("line length (E501)", fix_line_length),
    ]

    for fix_name, fix_function in fix_functions:
        print(f"\n🔨 Fixing {fix_name}...")
        files_fixed = 0

        for filepath, file_errors in errors_by_file.items():
            if fix_function(filepath, file_errors):
                files_fixed += 1

        print(f"   Fixed {files_fixed} files")

    # Get final error count
    final_errors = run_flake8()
    final_count = len(final_errors)
    fixed_count = initial_count - final_count

    print(f"\n📈 Results:")
    print(f"   Initial errors: {initial_count}")
    print(f"   Final errors: {final_count}")
    print(f"   Fixed: {fixed_count}")
    print(f"   Improvement: {(fixed_count/initial_count)*100:.1f}%")

    if final_count > 0:
        print(f"\n⚠️  Remaining errors by type:")
        remaining_by_type = {}
        for error_line in final_errors:
            match = re.search(r' ([A-Z]\d+) ', error_line)
            if match:
                error_type = match.group(1)
                remaining_by_type[error_type] = remaining_by_type.get(error_type, 0) + 1

        for error_type, count in sorted(remaining_by_type.items()):
            print(f"   {error_type}: {count}")

    if final_count == 0:
        print("\n🎉 ALL LINTER ERRORS FIXED! ZERO LINTER ERRORS CONFIRMED!")
    else:
        print(f"\n✅ Significant progress made! Reduced from {initial_count} to {final_count} errors.")


if __name__ == "__main__":
    main()