// The live raw log data link from Nicolaij
const GIST_URL = "https://gist.githubusercontent.com/mbordoni84/cbebbff97a5d2af80222bb48deb4e38/raw/ops_current.log";

async function fetchWarRoomData() {
    try {
        const response = await fetch(GIST_URL);
        const rawText = await response.text();
        
        // Split the file line by line and parse each line as JSON data
        const lines = rawText.trim().split('\n');
        const operations = lines.map(line => JSON.parse(line));
        
        // Update dashboard values and the data table
        updateDashboardKPIs(operations);
        renderOpsTable(operations);
        
    } catch (error) {
        console.error("Error fetching live war rooms ops:", error);
    }
}

function updateDashboardKPIs(ops) {
    let totalGoldStolen = 0;
    let totalRunesStolen = 0;
    let peasantsKilled = 0;
    let successfulOps = 0;

    ops.forEach(op => {
        if (op.outcome === 'success') successfulOps++;

        if (op.kind === 'instant' && op.result_value) {
            if (op.op === 'rob the vaults') totalGoldStolen += op.result_value;
            if (op.op === 'rob the towers') totalRunesStolen += op.result_value;
            if (op.op === 'fireball') peasantsKilled += op.result_value;
        }
    });

    // Send the numbers straight to the HTML display containers
    if(document.getElementById('stat-gold')) document.getElementById('stat-gold').innerText = totalGoldStolen.toLocaleString();
    if(document.getElementById('stat-runes')) document.getElementById('stat-runes').innerText = totalRunesStolen.toLocaleString();
    if(document.getElementById('stat-fireball')) document.getElementById('stat-fireball').innerText = peasantsKilled.toLocaleString();
    if(document.getElementById('stat-success-rate')) {
        document.getElementById('stat-success-rate').innerText = 
            ops.length ? `${Math.round((successfulOps / ops.length) * 100)}%` : '0%';
    }
}

function renderOpsTable(ops) {
    const tableBody = document.getElementById('ops-log-rows');
    if (!tableBody) return;
    
    tableBody.innerHTML = ''; // Clear out the loading placeholder

    // Reverse the log order so the absolute newest attacks display at the very top
    ops.reverse().forEach(op => {
        const row = document.createElement('tr');
        const outcomeClass = op.outcome === 'success' ? 'text-success' : 'text-fail';
        
        let detail = '—';
        if (op.outcome === 'success' && op.result_value) {
            detail = `+${op.result_value.toLocaleString()} ${op.unit || ''}`;
        } else if (op.outcome === 'fail' && op.fail_units_lost) {
            detail = `Lost ${op.fail_units_lost} ${op.fail_units_lost_unit}`;
        } else if (op.reflected_value) {
            detail = `REFLECTED (${op.reflected_value})`;
        }

        row.innerHTML = `
            <td><strong>${op.attacker_province}</strong></td>
            <td><span class="badge-${op.category}">${op.category.toUpperCase()}</span></td>
            <td><code>${op.op}</code></td>
            <td><strong>${op.target_province} (${op.target_kingdom || ''})</strong></td>
            <td><span class="${outcomeClass}">${op.outcome.toUpperCase()}</span></td>
            <td>${detail}</td>
        `;
        tableBody.appendChild(row);
    });
}

// Check for updates automatically every 2 minutes
setInterval(fetchWarRoomData, 120 * 1000);
// Run right away when the web page loads
window.onload = fetchWarRoomData;
                                     
