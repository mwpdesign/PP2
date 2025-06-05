#!/usr/bin/env python3
"""
Comprehensive linter error fix script for Healthcare IVR Platform.
This script addresses all flake8 errors systematically.
"""

import os
import re
import subprocess
from pathlib import Path


def run_flake8():
    """Run flake8 and return the output."""
    try:
        result = subprocess.run(
            ["python", "-m", "flake8", "backend/app/"],
            capture_output=True,
            text=True,
            cwd="/Users/michaelparson/PP2/healthcare-ivr-platform"
        )
        return result.stdout
    except Exception as e:
        print(f"Error running flake8: {e}")
        return ""


def fix_line_length_issues(file_path, line_num, line_content):
    """Fix line length issues by breaking long lines."""
    with open(file_path, 'r') as f:
        lines = f.readlines()

    if line_num <= len(lines):
        original_line = lines[line_num - 1]

        # Common patterns to fix
        if 'import' in original_line and len(original_line) > 79:
            # Split long import lines
            if 'from' in original_line and 'import' in original_line:
                parts = original_line.split('import')
                if len(parts) == 2:
                    from_part = parts[0] + 'import ('
                    imports = [imp.strip() for imp in parts[1].split(',')]
                    new_lines = [from_part + '\n']
                    for imp in imports:
                        new_lines.append(f"    {imp.strip()},\n")
                    new_lines.append(")\n")

                    lines[line_num - 1:line_num] = new_lines

        elif '=' in original_line and len(original_line) > 79:
            # Break assignment lines
            indent = len(original_line) - len(original_line.lstrip())
            if '(' in original_line:
                # Function call - break at parameters
                paren_pos = original_line.find('(')
                if paren_pos > 0:
                    before_paren = original_line[:paren_pos + 1]
                    after_paren = original_line[paren_pos + 1:]
                    lines[line_num - 1] = before_paren + '\n'
                    lines.insert(line_num, ' ' * (indent + 4) + after_paren)

        with open(file_path, 'w') as f:
            f.writelines(lines)


def remove_unused_imports(file_path, unused_imports):
    """Remove unused imports from a file."""
    with open(file_path, 'r') as f:
        content = f.read()

    lines = content.split('\n')
    new_lines = []

    for line in lines:
        should_remove = False
        for unused in unused_imports:
            if unused in line and ('import' in line or 'from' in line):
                should_remove = True
                break

        if not should_remove:
            new_lines.append(line)

    with open(file_path, 'w') as f:
        f.write('\n'.join(new_lines))


def fix_comparison_issues(file_path, line_num):
    """Fix comparison to True/False issues."""
    with open(file_path, 'r') as f:
        lines = f.readlines()

    if line_num <= len(lines):
        line = lines[line_num - 1]
        # Fix == True to is True
        line = re.sub(r'== True\b', 'is True', line)
        line = re.sub(r'== False\b', 'is False', line)
        # Better: remove == True entirely
        line = re.sub(r'\s*== True\b', '', line)
        line = re.sub(r'\s*== False\b', '', line)
        lines[line_num - 1] = line

        with open(file_path, 'w') as f:
            f.writelines(lines)


def fix_redefinition_issues(file_path, redefined_names):
    """Fix redefinition issues by removing duplicate definitions."""
    with open(file_path, 'r') as f:
        content = f.read()

    lines = content.split('\n')
    seen_classes = set()
    new_lines = []

    for line in lines:
        is_duplicate = False
        for name in redefined_names:
            if f'class {name}' in line and name in seen_classes:
                is_duplicate = True
                break
            elif f'class {name}' in line:
                seen_classes.add(name)

        if not is_duplicate:
            new_lines.append(line)

    with open(file_path, 'w') as f:
        f.write('\n'.join(new_lines))


def add_newline_at_eof(file_path):
    """Add newline at end of file if missing."""
    with open(file_path, 'r') as f:
        content = f.read()

    if content and not content.endswith('\n'):
        with open(file_path, 'w') as f:
            f.write(content + '\n')


def fix_indentation_issues(file_path, line_num):
    """Fix indentation issues."""
    with open(file_path, 'r') as f:
        lines = f.readlines()

    if line_num <= len(lines):
        line = lines[line_num - 1]
        # Fix common indentation patterns
        if line.strip().startswith('and ') or line.strip().startswith('or '):
            # Align with opening bracket
            prev_line = lines[line_num - 2] if line_num > 1 else ""
            if '(' in prev_line:
                paren_pos = prev_line.find('(')
                new_indent = ' ' * (paren_pos + 1)
                lines[line_num - 1] = new_indent + line.strip() + '\n'

        with open(file_path, 'w') as f:
            f.writelines(lines)


def main():
    """Main function to fix all linter errors."""
    print("🔧 Starting comprehensive linter error fix...")

    # Get initial flake8 output
    flake8_output = run_flake8()
    if not flake8_output:
        print("✅ No linter errors found!")
        return

    print(f"Found {len(flake8_output.splitlines())} linter errors")

    # Parse errors and group by type
    errors_by_file = {}
    for line in flake8_output.splitlines():
        if ':' in line:
            parts = line.split(':')
            if len(parts) >= 4:
                file_path = parts[0]
                line_num = int(parts[1])
                error_code = parts[3].strip().split()[0]
                error_msg = ':'.join(parts[3:]).strip()

                if file_path not in errors_by_file:
                    errors_by_file[file_path] = []
                errors_by_file[file_path].append({
                    'line': line_num,
                    'code': error_code,
                    'message': error_msg
                })

    # Fix errors by type
    for file_path, errors in errors_by_file.items():
        print(f"🔧 Fixing {len(errors)} errors in {file_path}")

        # Group errors by type
        unused_imports = []
        line_length_errors = []
        comparison_errors = []
        redefinition_errors = []
        eof_errors = []
        indentation_errors = []

        for error in errors:
            if error['code'] == 'F401':
                # Extract import name
                if 'imported but unused' in error['message']:
                    import_name = error['message'].split("'")[1]
                    unused_imports.append(import_name)
            elif error['code'] == 'E501':
                line_length_errors.append(error['line'])
            elif error['code'] == 'E712':
                comparison_errors.append(error['line'])
            elif error['code'] == 'F811':
                if 'redefinition' in error['message']:
                    name = error['message'].split("'")[1]
                    redefinition_errors.append(name)
            elif error['code'] == 'W292':
                eof_errors.append(error['line'])
            elif error['code'] in ['E129']:
                indentation_errors.append(error['line'])

        # Apply fixes
        if unused_imports:
            remove_unused_imports(file_path, unused_imports)

        if redefinition_errors:
            fix_redefinition_issues(file_path, redefinition_errors)

        for line_num in comparison_errors:
            fix_comparison_issues(file_path, line_num)

        for line_num in indentation_errors:
            fix_indentation_issues(file_path, line_num)

        if eof_errors:
            add_newline_at_eof(file_path)

        # Fix line length issues last (they're most complex)
        for line_num in line_length_errors[:5]:  # Limit to first 5 per file
            fix_line_length_issues(file_path, line_num, "")

    print("🔧 Running final flake8 check...")
    final_output = run_flake8()
    final_errors = len(final_output.splitlines()) if final_output else 0

    print(f"✅ Linter error fix complete!")
    print(f"📊 Remaining errors: {final_errors}")

    if final_errors > 0:
        print("⚠️  Some errors may require manual intervention:")
        print(final_output[:1000] + "..." if len(final_output) > 1000 else final_output)


if __name__ == "__main__":
    main()