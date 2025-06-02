// Admin password (in a real app, this would be handled server-side)
const ADMIN_PASSWORD = 'msfc2024';
const GITHUB_TOKEN = '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'; // You'll need to add your GitHub token here
const GITHUB_REPO = 'aaronajit09/tamumsfc'; // Format: 'username/repo'
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
    console.log('Attempting to upload to GitHub...');
    console.log('Repository:', GITHUB_REPO);
    console.log('Path:', path);
    
    if (!GITHUB_TOKEN || GITHUB_TOKEN === 'TOKEN') {
        console.error('GitHub token is not configured!');
        alert('GitHub token is not configured. Please set up your GitHub token in script.js');
        return null;
    }

    try {
        console.log('Making API request to GitHub...');
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

        console.log('GitHub API Response Status:', response.status);
        
        if (!response.ok) {
            const errorData = await response.json();
            console.error('GitHub API Error:', errorData);
            throw new Error(`GitHub API Error: ${errorData.message || 'Unknown error'}`);
        }

        const result = await response.json();
        console.log('Upload successful:', result);
        return result;
    } catch (error) {
        console.error('Error uploading to GitHub:', error);
        throw error;
    }
}

// Handle newsletter form submission
if (newsletterForm) {
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('pdfFile');

    // Drag and drop functionality
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, unhighlight, false);
    });

    function highlight(e) {
        dropZone.classList.add('highlight');
    }

    function unhighlight(e) {
        dropZone.classList.remove('highlight');
    }

    dropZone.addEventListener('drop', handleDrop, false);

    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        fileInput.files = files;
        updateFileName(files[0]);
    }

    function updateFileName(file) {
        const fileNameDisplay = document.getElementById('fileName');
        if (fileNameDisplay) {
            fileNameDisplay.textContent = file ? file.name : 'No file selected';
        }
    }

    fileInput.addEventListener('change', (e) => {
        updateFileName(e.target.files[0]);
    });

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

        // Show loading state
        const submitButton = newsletterForm.querySelector('button[type="submit"]');
        const originalButtonText = submitButton.textContent;
        submitButton.disabled = true;
        submitButton.textContent = 'Uploading...';

        try {
            console.log('Starting newsletter upload process...');
            console.log('File details:', {
                name: pdfFile.name,
                size: pdfFile.size,
                type: pdfFile.type
            });

            // Convert PDF to base64
            console.log('Converting PDF to base64...');
            const pdfBase64 = await fileToBase64(pdfFile);
            console.log('PDF converted successfully');
            
            // Create newsletter metadata
            const newsletter = {
                id: Date.now(),
                title,
                date,
                preview,
                filename: `newsletters/${Date.now()}-${pdfFile.name}`
            };

            console.log('Uploading PDF file to GitHub...');
            // Upload PDF to GitHub
            const uploadResult = await uploadToGitHub(
                newsletter.filename,
                pdfBase64,
                `Add newsletter: ${title}`
            );

            if (!uploadResult) {
                throw new Error('Failed to upload PDF file');
            }

            console.log('PDF uploaded successfully, updating newsletters list...');
            // Get existing newsletters
            const newslettersResponse = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/newsletters.json`);
            let newsletters = [];
            
            if (newslettersResponse.ok) {
                const data = await newslettersResponse.json();
                const content = atob(data.content);
                newsletters = JSON.parse(content);
                console.log('Retrieved existing newsletters:', newsletters.length);
            } else {
                console.log('No existing newsletters found, creating new list');
            }

            // Add new newsletter
            newsletters.unshift(newsletter);

            console.log('Updating newsletters.json...');
            // Update newsletters.json
            const updateResult = await uploadToGitHub(
                'newsletters.json',
                btoa(JSON.stringify(newsletters, null, 2)),
                `Update newsletters list: ${title}`
            );

            if (!updateResult) {
                throw new Error('Failed to update newsletters list');
            }

            console.log('Newsletter upload process completed successfully');
            // Show success message
            alert('Newsletter uploaded successfully!');
            
            // Reset form
            newsletterForm.reset();
            updateFileName(null);

            // Redirect to newsletters page
            window.location.href = 'newsletters.html';
        } catch (error) {
            console.error('Error in newsletter upload process:', error);
            alert(`Failed to upload newsletter: ${error.message}`);
        } finally {
            // Reset button state
            submitButton.disabled = false;
            submitButton.textContent = originalButtonText;
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
