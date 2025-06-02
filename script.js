// Admin password (in a real app, this would be handled server-side)
const ADMIN_PASSWORD = 'msfc2024';
const GITHUB_TOKEN = ''; // You'll need to add your GitHub token here
const GITHUB_REPO = ''; // Format: 'username/repo'
const GITHUB_BRANCH = 'main';

// DOM Elements
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const adminLink = document.getElementById('adminLink');
const loginModal = document.getElementById('loginModal');
const loginForm = document.getElementById('loginForm');
const closeModal = document.querySelector('.close');
const adminControls = document.getElementById('adminControls');
const newslettersList = document.getElementById('newslettersList');
const newsletterForm = document.getElementById('newsletterForm');

// Check if user is logged in
function isLoggedIn() {
    return localStorage.getItem('isAdmin') === 'true';
}

// Update UI based on login status
function updateUI() {
    if (isLoggedIn()) {
        loginBtn.style.display = 'none';
        logoutBtn.style.display = 'block';
        adminLink.style.display = 'block';
        if (adminControls) adminControls.style.display = 'block';
    } else {
        loginBtn.style.display = 'block';
        logoutBtn.style.display = 'none';
        adminLink.style.display = 'none';
        if (adminControls) adminControls.style.display = 'none';
    }
}

// Show login modal
loginBtn.addEventListener('click', () => {
    loginModal.style.display = 'block';
});

// Close login modal
closeModal.addEventListener('click', () => {
    loginModal.style.display = 'none';
});

// Handle login form submission
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const password = document.getElementById('password').value;
    
    if (password === ADMIN_PASSWORD) {
        localStorage.setItem('isAdmin', 'true');
        loginModal.style.display = 'none';
        updateUI();
    } else {
        alert('Invalid password');
    }
});

// Handle logout
logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('isAdmin');
    updateUI();
});

// Convert file to base64
async function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = error => reject(error);
    });
}

// Upload file to GitHub
async function uploadToGitHub(path, content, message) {
    try {
        const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${path}`, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${GITHUB_TOKEN}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message,
                content,
                branch: GITHUB_BRANCH
            })
        });

        if (!response.ok) {
            throw new Error('Failed to upload to GitHub');
        }

        return await response.json();
    } catch (error) {
        console.error('Error uploading to GitHub:', error);
        throw error;
    }
}

// Handle newsletter form submission
if (newsletterForm) {
    newsletterForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!isLoggedIn()) {
            alert('Please log in first');
            return;
        }

        const title = document.getElementById('title').value;
        const date = document.getElementById('date').value;
        const preview = document.getElementById('preview').value;
        const pdfFile = document.getElementById('pdfFile').files[0];
        
        if (!pdfFile) {
            alert('Please select a PDF file');
            return;
        }

        try {
            // Convert PDF to base64
            const pdfBase64 = await fileToBase64(pdfFile);
            
            // Create newsletter metadata
            const newsletter = {
                id: Date.now(),
                title,
                date,
                preview,
                filename: `newsletters/${Date.now()}-${pdfFile.name}`
            };

            // Upload PDF to GitHub
            await uploadToGitHub(
                newsletter.filename,
                pdfBase64,
                `Add newsletter: ${title}`
            );

            // Get existing newsletters
            const newslettersResponse = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/newsletters.json`);
            let newsletters = [];
            
            if (newslettersResponse.ok) {
                const data = await newslettersResponse.json();
                const content = atob(data.content);
                newsletters = JSON.parse(content);
            }

            // Add new newsletter
            newsletters.unshift(newsletter);

            // Update newsletters.json
            await uploadToGitHub(
                'newsletters.json',
                btoa(JSON.stringify(newsletters, null, 2)),
                `Update newsletters list: ${title}`
            );

            // Redirect to newsletters page
            window.location.href = 'newsletters.html';
        } catch (error) {
            console.error('Error uploading newsletter:', error);
            alert('Failed to upload newsletter. Please try again.');
        }
    });
}

// Display newsletters
async function displayNewsletters() {
    if (!newslettersList) return;
    
    try {
        const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/newsletters.json`);
        
        if (!response.ok) {
            throw new Error('Failed to fetch newsletters');
        }

        const data = await response.json();
        const content = atob(data.content);
        const newsletters = JSON.parse(content);
        
        if (newsletters.length === 0) {
            newslettersList.innerHTML = '<p class="no-newsletters">No newsletters available yet.</p>';
            return;
        }
        
        newslettersList.innerHTML = newsletters.map(newsletter => `
            <div class="newsletter-card">
                <div>
                    <h2>${newsletter.title}</h2>
                    <p class="date">${new Date(newsletter.date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    })}</p>
                    <p class="preview">${newsletter.preview}</p>
                </div>
                <a href="https://raw.githubusercontent.com/${GITHUB_REPO}/${GITHUB_BRANCH}/${newsletter.filename}" target="_blank" class="btn">View PDF</a>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error fetching newsletters:', error);
        newslettersList.innerHTML = '<p class="error">Failed to load newsletters. Please try again later.</p>';
    }
}

// Initialize
updateUI();
displayNewsletters(); 
