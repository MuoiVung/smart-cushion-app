import re
import glob

def clear_data(filepath):
    print(f"Opening {filepath}")
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    # Replace arbitrary percentage strings (e.g. 74%, 89%)
    content = re.sub(r'>\s*\d{1,3}(?:\.\d+)?%\s*<', '>--%<', content)
    # Replace arbitrary big numbers (like 512, 498) that are inside span or div
    content = re.sub(r'>\s*\d{1,4}\s*<', '>--<', content)
    # Time formats like 3h 42m, 42m, 00:23:47
    content = re.sub(r'>\s*\d{1,2}h \d{1,2}m\s*<', '>--h --m<', content)
    content = re.sub(r'>\s*\d{1,2}m\s*<', '>--m<', content)
    content = re.sub(r'>\s*\d{2}:\d{2}:\d{2}\s*<', '>--:--:--<', content)
    # "7 days", "12 Warnings"
    content = re.sub(r'>\s*\d{1,2} days\s*<', '>-- days<', content)
    content = re.sub(r'>\s*\d{1,2} Warnings\s*<', '>-- Warnings<', content)
    # "2:00 PM - 3:00 PM"
    content = re.sub(r'>\s*\d{1,2}:\d{2} [AP]M - \d{1,2}:\d{2} [AP]M\s*<', '>--:-- PM - --:-- PM<', content)
    # Text
    content = re.sub(r'>Excellent<', '>--<', content)
    # Status badges content
    content = re.sub(r'>\s*\d{1,3}°C\s*<', '>--°C<', content)
    content = re.sub(r'>Active<', '>--<', content)
    content = re.sub(r'>Static<', '>--<', content)
    
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)

for filepath in glob.glob("*.html"):
    clear_data(filepath)
    print(f"Cleared {filepath}")
