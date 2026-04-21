import re
import glob

def clear_user_data(filepath):
    print(f"Opening {filepath}")
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    # Clear user names
    content = content.replace("Dr. Smith's Dashboard", "[Doctor Name]'s Dashboard")
    content = content.replace("Vu Nguyen", "[Clinician Name]")
    content = content.replace("Good afternoon, Vu", "Good afternoon, [User]")
    
    # Clear system ID
    content = content.replace("USR-001", "[System-ID]")
    
    # Clear specific dates
    content = re.sub(r'Monday, 12 Oct', '[Current Date]', content)
    content = re.sub(r'Apr \d{2}, 2024', '[Session Date]', content)

    # Empty profile images URLs (Find img src starting with https://lh3)
    content = re.sub(r'src="https://lh3.googleusercontent.com/aida-public/[^"]+"', 'src=""', content)

    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)

for filepath in glob.glob("*.html"):
    clear_user_data(filepath)
    print(f"Cleared user data from {filepath}")
