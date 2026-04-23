import glob
import os

new_js_code = """
<script>
document.addEventListener("DOMContentLoaded", () => {
    // Page routing map based on Material Icons
    const pageMap = {
        'dashboard': 'home.html',
        'videocam': 'live monitor.html', 
        'insights': 'insights.html',
        'psychology': 'ai advisor.html',
        'history': 'session history.html',
        'settings': 'settings.html',
        'account_circle': 'settings.html'
    };

    // Attach click events to navigation links
    document.querySelectorAll('.material-symbols-outlined').forEach(icon => {
        const parent = icon.parentElement;
        const iconName = icon.textContent.trim() || icon.getAttribute('data-icon');
        
        if (pageMap[iconName]) {
            // Find a suitable clickable wrapper (A, DIV, BUTTON) or use the icon itself
            const clickable = (parent.tagName === 'A' || parent.tagName === 'DIV' || parent.tagName === 'BUTTON') ? parent : icon;
            clickable.style.cursor = 'pointer';
            clickable.onclick = (e) => {
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
            btn.onclick = () => alert("▶️ Starting a new live monitoring session...");
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
    
    if "<script>" in content and "pageMap" in content:
        # Split at our injected script start and replace the rest
        base_content = content.split('<script>\ndocument.addEventListener("DOMContentLoaded"')[0]
        base_content += new_js_code.strip()
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(base_content)

print("Updated JS routing for renamed files!")
