# MSFC Website

A static website for Medical Students for Choice, featuring board member information, medical resources, and newsletter management.

## Features

- Responsive design
- Board member profiles
- Medical resources section
- Newsletter management system
- Admin authentication
- GitHub-based newsletter storage

## Setup

1. Create a new GitHub repository for your website

2. Create a GitHub Personal Access Token:
   - Go to GitHub Settings > Developer Settings > Personal Access Tokens
   - Generate a new token with `repo` scope
   - Copy the token

3. Update the GitHub configuration in `script.js`:
   ```javascript
   const GITHUB_TOKEN = 'your-token-here';
   const GITHUB_REPO = 'your-username/repo-name';
   const GITHUB_BRANCH = 'main';
   ```

4. Deploy to GitHub Pages:
   - Go to your repository settings
   - Scroll down to "GitHub Pages" section
   - Select the branch you want to deploy (usually `main`)
   - Save the settings

5. Your website will be available at: `https://your-username.github.io/repo-name`

## Admin Access

- Default admin password: `msfc2024`
- To change the password, update the `ADMIN_PASSWORD` constant in `script.js`

## Newsletter Management

1. Log in as admin using the password
2. Go to the Newsletters page
3. Click "Upload New Newsletter"
4. Fill out the form and upload a PDF
5. The newsletter will be stored in your GitHub repository and visible to all visitors

## File Structure

```
├── index.html          # Home page
├── board.html          # Board members page
├── medical-info.html   # Medical resources page
├── newsletters.html    # Newsletters page
├── admin.html          # Admin upload page
├── style.css           # Styles
└── script.js           # JavaScript functionality
```

## Security Notes

- The admin password is stored in the frontend code. In a production environment, you should implement proper backend authentication.
- GitHub tokens should be kept secure and not committed to the repository.
- Consider implementing rate limiting and additional security measures for the admin interface.

## Contributing

1. Fork the repository
2. Create a new branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License. 
