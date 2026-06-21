// The exact verified live raw log data link from Nicolaij
const DATA_URL = "https://gist.githubusercontent.com/mbordoni84/cbebbff97a5d2af80222bb48deb4e38/raw/ops_current.log";

// Wait for the website layout to finish rendering
document.addEventListener('DOMContentLoaded', () => {
    initOpsFeed();
});

function initOpsFeed() {
    // Look for the main dashboard element on your site
    const dashboardContainer = document.getElementById('dashboard');
    if (!dashboardContainer) {
        // If the element isn't ready yet (waiting on login), retry in 1 second
        setTimeout(initOpsFeed, 1000);
        return;
    }

    // Build the structural card for the table layout
    const feedSection = document.createElement('div');
    feedSection.className = 'card style-plain';
    feedSection.style.marginTop = '20px';
    feedSection.innerHTML = `
        <div class="card-header" style="background-color: #1e3a5f; color: #7eb8f7; padding: 10px 15px; font-weight: bold; border-radius: 4px 4px 0 0; font-family: Georgia, serif;">
            ⚔️ Live Kingdom Operations Feed (Auto-Updates)
        </div>
        <div style="background: #0d1520; padding: 15px; border: 1px solid #1e3a5f; border-top: none; border-radius: 0 0 4px 4px;">
            <div style="overflow-x: auto;">
                <table style="width:100%; border-collapse:collapse; font-size:13px; text-align:left; color: #c8d6e8; font-family: 'Courier New', monospace;">
                    <thead>
                        <tr style="border-bottom:2px solid #1e3a5f; background:#080b10; color: #7eb8f7;">
                            <th style="padding:8px;">Time</th>
                            <th style="padding:8px;">Attacker</th>
                            <th style="padding:8px;">Operation</th>
                            <th style="padding:8px;">Target</th>
                            <th style="padding:8px;">Result</th>
                        </tr>
                    </thead>
                    <tbody id="ops-feed-rows">
                        <tr><td colspan="5" style="text-align:center; padding:15px; color:#4a7090; font-style:italic;">Connecting to live logs...</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;
    dashboardContainer.appendChild(feedSection);

    // Initial data load, then auto-refresh every 60 seconds
    fetchAndUpdateOps();
    setInterval(fetchAndUpdateOps, 60 * 1000);
}

async function fetchAndUpdateOps() {
    const tableBody = document.getElementById('ops-feed-rows');
    if (!tableBody) return;

    try {
        const response = await fetch(DATA_URL);
        if (!response.ok) throw new Error(`HTTP status error: ${response.status}`);
        
        const rawText = await response.text();
        
        // Clean up empty lines and split by row
        const lines = rawText.trim().split('\n').filter(line => line.trim() !== '');
        
        if (lines.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:15px; color:#4a7090;">No operations recorded in logs yet.</td></tr>`;
            return;
        }

        tableBody.innerHTML = ''; // Wipe out loading text

        // Loop through log items in reverse chronological order (newest logs up top!)
        lines.reverse().forEach(line => {
            try {
                const op = JSON.parse(line);
                const row = document.createElement('tr');
                row.style.borderBottom = '1px solid #1e3a5f';

                // Determine precise result styling from the log properties
                let resultText = '';
                if (op.outcome === 'success') {
                    if (op.result_value) {
                        resultText = `<span style="color:#2ecc71; font-weight:bold;">+${op.result_value.toLocaleString()} ${op.unit || ''}</span>`;
                    } else {
                        resultText = `<span style="color:#2ecc71; font-weight:bold;">SUCCESS</span>`;
                    }
                } else {
                    if (op.fail_units_lost) {
                        resultText = `<span style="color:#e74c3c;">FAIL (Lost ${op.fail_units_lost} ${op.fail_units_lost_unit || 'thieves'})</span>`;
                    } else {
                        resultText = `<span style="color:#e74c3c;">FAIL</span>`;
                    }
                }

                row.innerHTML = `
                    <td style="padding:8px; color:#4a7090; font-size:11px;">${op.date || '—'}</td>
                    <td style="padding:8px; color:#fff; font-weight:bold;">${op.attacker_province || 'Unknown'}</td>
                    <td style="padding:8px;"><span style="background:#080b10; border:1px solid #1e3a5f; padding:2px 6px; border-radius:3px; color:#7eb8f7;">${op.op || 'Op'}</span></td>
                    <td style="padding:8px; font-weight:bold;">${op.target_province || 'Target'}</td>
                    <td style="padding:8px;">${resultText}</td>
                `;
                tableBody.appendChild(row);
            } catch (jsonErr) {
                // Ignore empty or malformed setup rows silently
                console.error("Skipping raw row line error:", jsonErr);
            }
        });

    } catch (error) {
        console.error("Ops Feed connection failed:", error);
        tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:15px; color:#e74c3c;">Error streaming log server data. Retrying...</td></tr>`;
    }
                          }
                          
