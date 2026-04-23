import glob
import os
import re

js_code = """
<script>
document.addEventListener("DOMContentLoaded", () => {
    // Page routing map based on Material Icons
    const pageMap = {
        'dashboard': 'home.html',
        'videocam': 'live monitor.html', 
        'insights': 'insights.html',
        'psychology': 'ai advisor.html',
        'history': 'session history.html',
        'settings': 'settings.html'
    };

    // Attach click events to navigation links
    document.querySelectorAll('.material-symbols-outlined').forEach(icon => {
        const parent = icon.parentElement;
        const iconName = icon.textContent.trim() || icon.getAttribute('data-icon');
        
        if (pageMap[iconName] && (parent.tagName === 'A' || parent.tagName === 'DIV')) {
            parent.style.cursor = 'pointer';
            parent.onclick = (e) => {
                e.preventDefault();
                window.location.href = pageMap[iconName];
            };
        }
    });

    // Add interactivity to specific action buttons
    document.querySelectorAll('button').forEach(btn => {
        const text = btn.textContent.trim();
        if(text.includes('Test Connection')) {
            btn.onclick = () => alert("📡 Simulating Connection Test... Connected successfully to esp32-cushion-01!");
        } else if(text.includes('Export CSV')) {
            btn.onclick = () => alert("📊 File generated: posture_data_export.csv started downloading.");
        } else if(text.includes('Export PDF')) {
            btn.onclick = () => alert("📑 File generated: clinical_report.pdf started downloading.");
        } else if(text.includes('Start New Session')) {
            btn.onclick = () => {
                window.location.href = 'start new session.html';
            };
        } else if(text.includes('Exit Session')) {
            btn.onclick = () => {
                window.location.href = 'home.html';
            };
        } else if(text.includes('Begin Tracking')) {
            btn.onclick = () => {
                window.location.href = 'live monitor.html';
            };
        } else if(text.includes('Logout')) {
            btn.onclick = () => alert("👋 Logging out of Dr. Smith's Dashboard...");
        }
    });
});
</script>
</body>
"""

for filepath in glob.glob("*.html"):
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()
    
    # Remove previously injected script block if it exists
    if 'document.addEventListener("DOMContentLoaded"' in content:
        content = re.sub(r'<script>\s*document\.addEventListener\("DOMContentLoaded".*?</script>\s*</body>', '</body>', content, flags=re.DOTALL)

    content = content.replace("</body>", js_code)
    
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)

print("Injected JS routing into all HTML files successfully!")
