#!/usr/bin/env python3
"""
ELS Madrid Retheme Script
Changes the app from dark theme to ELS Madrid light theme:
  - Background: #efefef (light gray)
  - Blue: #1552ab
  - Text: dark (#111827)
  - Clean institutional look
"""

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
]

def retheme(content):
    # ── Blue brand color ──────────────────────────────────────────────────────
    content = content.replace('#1b52a9', '#1552ab')
    content = content.replace('#1B52A9', '#1552ab')

    # ── Dark backgrounds → light ──────────────────────────────────────────────
    content = content.replace('bg-black', 'bg-[#efefef]')
    content = content.replace('bg-[#000000]', 'bg-[#efefef]')
    content = content.replace('bg-[#0a0a0a]', 'bg-[#f5f5f5]')
    content = content.replace('bg-[#0A0A0A]', 'bg-[#f5f5f5]')
    content = content.replace('bg-[#111]', 'bg-[#f0f0f0]')
    content = content.replace('bg-[#151515]', 'bg-[#e8e8e8]')
    content = content.replace('bg-[#1b1b1b]', 'bg-[#e0e0e0]')
    content = content.replace('bg-[#111827]', 'bg-[#efefef]')

    # Semi-transparent white overlays → black overlays (inverted for light bg)
    content = content.replace('bg-white/2', 'bg-black/3')
    content = content.replace('bg-white/5', 'bg-black/5')
    content = content.replace('bg-white/10', 'bg-white')
    content = content.replace('bg-white/20', 'bg-black/10')

    # hover semi-transparent
    content = content.replace('hover:bg-white/2', 'hover:bg-black/3')
    content = content.replace('hover:bg-white/5', 'hover:bg-black/5')

    # ── Borders ───────────────────────────────────────────────────────────────
    content = content.replace('border-white/10', 'border-black/10')
    content = content.replace('border-white/5', 'border-black/8')
    content = content.replace('divide-white/5', 'divide-black/8')
    content = content.replace('divide-white/10', 'divide-black/10')

    # ── Text opacity variants (safe: no button labels use these) ──────────────
    content = content.replace('text-white/80', 'text-[#111827]/80')
    content = content.replace('text-white/70', 'text-[#111827]/70')
    content = content.replace('text-white/60', 'text-[#111827]/60')
    content = content.replace('text-white/50', 'text-[#111827]/50')
    content = content.replace('text-white/40', 'text-[#111827]/40')
    content = content.replace('text-white/30', 'text-[#111827]/30')
    content = content.replace('text-white/20', 'text-[#111827]/20')
    content = content.replace('text-white/10', 'text-[#111827]/10')

    # placeholder text (on light inputs)
    content = content.replace('placeholder:text-white/20', 'placeholder:text-[#111827]/30')
    content = content.replace('placeholder:text-white/40', 'placeholder:text-[#111827]/40')
    content = content.replace('placeholder:text-black/20', 'placeholder:text-[#111827]/30')

    # ── Standalone text-white → dark, but preserve hover:text-white (buttons) ─
    # Replace " text-white " patterns but NOT "hover:text-white"
    # Strategy: use word-boundary aware regex
    # Replace text-white that is NOT preceded by "hover:" or "active:" or "group-hover:"
    def replace_standalone_text_white(m):
        prefix = m.group(1)
        # Keep hover, active, focus, group-hover, dark: variants
        if prefix in ('hover:', 'active:', 'focus:', 'group-hover:', 'dark:',
                      'disabled:', 'checked:', 'visited:', 'focus-within:'):
            return m.group(0)
        return prefix + 'text-[#111827]'

    content = re.sub(
        r'((?:hover:|active:|focus:|group-hover:|dark:|disabled:|)\b)text-white\b(?!/)',
        replace_standalone_text_white,
        content
    )

    # ── dark: prefix classes (were used as light-mode override, now redundant) ─
    # The app used dark:bg-white / dark:text-black as light mode
    # Now that we're fully light, simplify these
    content = content.replace('dark:bg-white', 'bg-white')
    content = content.replace('dark:text-black', 'text-[#111827]')
    content = content.replace('dark:bg-black/5', 'bg-black/5')
    content = content.replace('dark:bg-black/2', 'bg-black/2')
    content = content.replace('dark:border-black/5', 'border-black/5')
    content = content.replace('dark:border-black/10', 'border-black/10')
    content = content.replace('dark:border-black/8', 'border-black/8')
    content = content.replace('dark:text-black/80', 'text-[#111827]/80')
    content = content.replace('dark:text-black/70', 'text-[#111827]/70')
    content = content.replace('dark:text-black/60', 'text-[#111827]/60')
    content = content.replace('dark:text-black/50', 'text-[#111827]/50')
    content = content.replace('dark:text-black/40', 'text-[#111827]/40')
    content = content.replace('dark:text-black/30', 'text-[#111827]/30')
    content = content.replace('dark:text-black/20', 'text-[#111827]/20')
    content = content.replace('dark:text-black', 'text-[#111827]')
    content = content.replace('dark:placeholder:text-black/20', 'placeholder:text-[#111827]/30')

    # Input/Select backgrounds
    content = content.replace('bg-transparent', 'bg-transparent')

    # shadow-glow update
    content = content.replace('0 0 15px rgba(27, 82, 169, 0.3)', '0 0 15px rgba(21, 82, 171, 0.3)')

    return content


def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        original = f.read()
    updated = retheme(original)
    if updated != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(updated)
        print(f'✅ Updated: {filepath}')
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
