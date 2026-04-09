// Placeholder data - replace with real API calls
const data = {
    airTemp: { current: 15.5, history: [14, 15, 16, 15.5] },
    waterTemp: { current: 12.3, history: [11, 12, 13, 12.3] },
    waterLevel: { current: 245, history: [240, 242, 244, 245] },
    waterQuality: { current: 7.2, history: [6.5, 7.0, 7.5, 7.2] }
};

// Load current values
document.getElementById('air-temp-value').textContent = data.airTemp.current + ' °C';
document.getElementById('water-temp-value').textContent = data.waterTemp.current + ' °C';
document.getElementById('water-level-value').textContent = data.waterLevel.current + ' cm';
document.getElementById('water-quality-value').textContent = data.waterQuality.current + ' /10';

// Modal elements
const modal = document.getElementById('chart-modal');
const closeBtn = document.querySelector('.close');
let chart;

// Close modal
closeBtn.onclick = function() {
    modal.style.display = 'none';
    if (chart) {
        chart.destroy();
    }
}

// Click on tiles to show chart
document.querySelectorAll('.tile').forEach(tile => {
    tile.addEventListener('click', function() {
        const id = this.id;
        let chartData;
        let label;

        switch(id) {
            case 'air-temp':
                chartData = data.airTemp.history;
                label = 'Lufttemperatur (°C)';
                break;
            case 'water-temp':
                chartData = data.waterTemp.history;
                label = 'Wassertemperatur (°C)';
                break;
            case 'water-level':
                chartData = data.waterLevel.history;
                label = 'Pegelstand (cm)';
                break;
            case 'water-quality':
                chartData = data.waterQuality.history;
                label = 'Wasserqualität (/10)';
                break;
        }

        modal.style.display = 'block';

        const ctx = document.getElementById('chart').getContext('2d');
        chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Tag 1', 'Tag 2', 'Tag 3', 'Heute'],
                datasets: [{
                    label: label,
                    data: chartData,
                    borderColor: 'rgba(0, 123, 255, 1)',
                    backgroundColor: 'rgba(0, 123, 255, 0.2)',
                    fill: true
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: false
                    }
                }
            }
        });
    });
});

// Close modal when clicking outside
window.onclick = function(event) {
    if (event.target == modal) {
        modal.style.display = 'none';
        if (chart) {
            chart.destroy();
        }
    }
}