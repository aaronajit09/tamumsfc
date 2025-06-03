// Admin password (in a real app, this would be handled server-side)
const ADMIN_PASSWORD = 'msfc2024';

// Supabase configuration
const supabaseUrl = 'https://diedcgshhudtpbnfbdmy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpZWRjZ3NoaHVkdHBibmZiZG15Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg5MDUyMDUsImV4cCI6MjA2NDQ4MTIwNX0.lzOZ8zp2D2MFv9u-OHw3hoodyfX8CjCqx1SVyGfcoNk';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

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
const fileInput = document.getElementById('pdfFile');

// Debug logs
console.log('Supabase client:', supabase);
console.log('DOM Elements:', {
    loginBtn,
    loginModal,
    loginForm,
    closeModal,
    fileInput
});

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
if (loginBtn) {
    console.log('Login button found, adding click listener');
    loginBtn.addEventListener('click', () => {
        console.log('Login button clicked');
        if (loginModal) {
            console.log('Showing modal');
            loginModal.style.display = 'block';
        } else {
            console.log('Modal element not found');
        }
    });
} else {
    console.log('Login button not found');
}

// Close login modal
if (closeModal) {
    closeModal.addEventListener('click', () => {
        if (loginModal) {
            loginModal.style.display = 'none';
        }
    });
}

// Close modal when clicking outside
window.addEventListener('click', (e) => {
    if (e.target === loginModal) {
        loginModal.style.display = 'none';
    }
});

// Handle login form submission
if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const password = document.getElementById('password').value;
        
        if (password === ADMIN_PASSWORD) {
            localStorage.setItem('isAdmin', 'true');
            if (loginModal) {
                loginModal.style.display = 'none';
            }
            updateUI();
        } else {
            alert('Invalid password');
        }
    });
}

// Handle logout
logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('isAdmin');
    updateUI();
});

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

    if (fileInput) {
        console.log('File input found, adding change listener');
        fileInput.addEventListener('change', (e) => {
            console.log('File input change event fired', e.target.files[0]);
            updateFileName(e.target.files[0]);
        });
    } else {
        console.log('File input element with ID "pdfFile" not found.');
    }

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
            // Upload PDF to Supabase Storage
            const fileName = `${Date.now()}-${pdfFile.name}`;
            console.log('Uploading file with name:', fileName);
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('newsletters')
                .upload(fileName, pdfFile);

            if (uploadError) throw uploadError;

            // Get the public URL for the uploaded file
            const { data: { publicUrl } } = supabase.storage
                .from('newsletters')
                .getPublicUrl(fileName);
            console.log('Generated public URL:', publicUrl);

            // Create newsletter record in Supabase database
            const { error: dbError } = await supabase
                .from('newsletters')
                .insert([
                    {
                        title,
                        date,
                        preview,
                        pdf_url: publicUrl,
                        created_at: new Date().toISOString()
                    }
                ]);

            if (dbError) throw dbError;

            // Show success message
            alert('Newsletter uploaded successfully!');
            
            // Reset form
            newsletterForm.reset();
            updateFileName(null);

            // Redirect to newsletters page
            window.location.href = 'newsletters.html';
        } catch (error) {
            console.error('Error in newsletter upload process:', error);
            alert('Failed to upload newsletter. Error: ' + (error.message || error));
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
        const { data: newsletters, error } = await supabase
            .from('newsletters')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        
        if (!newsletters || newsletters.length === 0) {
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
                <a href="${newsletter.pdf_url}" target="_blank" class="btn">View PDF</a>
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

// Handle newsletter subscription
const subscriptionForm = document.getElementById('subscriptionForm');
if (subscriptionForm) {
    subscriptionForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const emailInput = document.getElementById('subscriberEmail');
        const messageElement = document.getElementById('subscriptionMessage');
        const email = emailInput.value.trim();
        
        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            messageElement.textContent = 'Please enter a valid email address.';
            messageElement.className = 'subscription-message error';
            return;
        }

        try {
            // Check if email already exists
            const { data: existingSubscriber, error: checkError } = await supabase
                .from('subscribers')
                .select('email')
                .eq('email', email)
                .single();

            if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
                throw checkError;
            }

            if (existingSubscriber) {
                messageElement.textContent = 'You are already subscribed to our newsletter!';
                messageElement.className = 'subscription-message error';
                return;
            }

            // Insert new subscriber
            const { error: insertError } = await supabase
                .from('subscribers')
                .insert([
                    {
                        email,
                        // subscribed_at: new Date().toISOString()
                    }
                ]);

            if (insertError) throw insertError;

            // Show success message
            messageElement.textContent = 'Thank you for subscribing to our newsletter!';
            messageElement.className = 'subscription-message success';
            emailInput.value = '';

        } catch (error) {
            console.error('Error in subscription process:', error);
            messageElement.textContent = 'Failed to subscribe. Please try again later.';
            messageElement.className = 'subscription-message error';
        }
    });
} 
