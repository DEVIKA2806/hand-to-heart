(function protectResellerDashboard() {
    const resToken = localStorage.getItem('resellerToken');
    const resData = JSON.parse(localStorage.getItem('reseller'));

    // Check if the reseller token exists AND the role is 'reseller'
    if (!resToken || !resData || resData.role !== 'reseller') {
        alert("Access Denied: Please log in as a Reseller.");
        window.location.href = 'index.html';
    }
})();

document.getElementById('resellForm').onsubmit = async e => {
    e.preventDefault();
    const formData = new FormData(e.target); 
    const msgElement = document.getElementById('dashboardMsg');

    // Reset message state
    msgElement.style.display = 'none';
    msgElement.textContent = '';

    try {
        const res = await fetch('/api/resell/add', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('resellerToken')
            },
            body: formData
        });

        const data = await res.json();
        
        msgElement.style.display = 'block';

        if(data.success) {
            // SUCCESS STATE
            msgElement.style.backgroundColor = '#d4edda'; // Light green background
            msgElement.style.color = '#155724';           // Dark green text
            msgElement.textContent = "Item added successfully!";
            
            // Clear the form
            e.target.reset();

            // Optional: Redirect after a short delay so they see the message
            setTimeout(() => {
                window.location.href = 'resell.html';
            }, 2000);
        } else {
            // ERROR STATE
            msgElement.style.backgroundColor = '#f8d7da'; // Light red background
            msgElement.style.color = '#721c24';           // Dark red text
            msgElement.textContent = "Upload failed: " + (data.message || "Unknown error");
        }
    } catch (err) {
        msgElement.style.display = 'block';
        msgElement.style.backgroundColor = '#f8d7da';
        msgElement.style.color = '#721c24';
        msgElement.textContent = "Network error. Please try again.";
    }
};