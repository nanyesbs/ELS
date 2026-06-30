#!/usr/bin/env python3
import re
import os

FILES = [
    'App.tsx',
    'components/Navbar.tsx',
    'components/Header.tsx',
    'components/ParticipantCard.tsx',
    'components/ProfileModal.tsx',
    'components/AdminConsole.tsx',
    'components/RegistrationForm.tsx',
    'index.html',
]

def recolor(content):
    # Replace #111827 with #1552ab (both case variants)
    content = content.replace('#111827', '#1552ab')
    content = content.replace('#111827'.upper(), '#1552ab')
    
    # Let's ensure text opacity classes like text-[#1552ab]/80 are clean
    # Let's check for duplicate background/text classes that might occur
    return content

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        original = f.read()
    updated = recolor(original)
    if updated != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(updated)
        print(f'✅ Recolored: {filepath}')
    else:
        print(f'⏭  No changes: {filepath}')

if __name__ == '__main__':
    base = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    for rel in FILES:
        path = os.path.join(base, rel)
        if os.path.exists(path):
            process_file(path)
        else:
            print(f'❌ Not found: {path}')
    print('\nDone!')
