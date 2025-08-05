// Global variables
let currentPage = 'home';
let resumeData = {
    personal: {
        name: '',
        email: '',
        phone: '',
        location: '',
        linkedin: '',
        website: ''
    },
    summary: '',
    experience: [],
    education: [],
    skills: []
};

let jobsData = [];
let currentSection = 'personal';

// API Base URL
const API_BASE_URL = 'http://localhost:5000/api';

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeNavigation();
    initializeJobsPage();
    initializeResumeBuilder();
    initializeATSScore();
    initializeContactForm();
    loadJobs();
});

// Navigation functionality
function initializeNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    const pages = document.querySelectorAll('.page');
    const navToggle = document.getElementById('nav-toggle');
    const navMenu = document.getElementById('nav-menu');

    // Handle navigation clicks
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetPage = this.getAttribute('data-page');
            showPage(targetPage);
            
            // Update active nav link
            navLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');
            
            // Close mobile menu
            navMenu.classList.remove('active');
        });
    });

    // Handle button clicks that navigate to pages
    document.addEventListener('click', function(e) {
        if (e.target.hasAttribute('data-page')) {
            const targetPage = e.target.getAttribute('data-page');
            showPage(targetPage);
            
            // Update active nav link
            navLinks.forEach(l => l.classList.remove('active'));
            const targetNavLink = document.querySelector(`[data-page="${targetPage}"]`);
            if (targetNavLink && targetNavLink.classList.contains('nav-link')) {
                targetNavLink.classList.add('active');
            }
        }
    });

    // Mobile menu toggle
    navToggle.addEventListener('click', function() {
        navMenu.classList.toggle('active');
    });

    function showPage(pageId) {
        pages.forEach(page => {
            page.classList.remove('active');
            if (page.id === pageId) {
                page.classList.add('active');
                page.classList.add('fade-in-up');
            }
        });
        currentPage = pageId;
        
        // Update URL hash
        window.location.hash = pageId;
    }

    // Handle browser back/forward
    window.addEventListener('hashchange', function() {
        const hash = window.location.hash.substring(1);
        if (hash && document.getElementById(hash)) {
            showPage(hash);
            
            // Update active nav link
            navLinks.forEach(l => l.classList.remove('active'));
            const targetNavLink = document.querySelector(`[data-page="${hash}"]`);
            if (targetNavLink) {
                targetNavLink.classList.add('active');
            }
        }
    });

    // Load initial page from URL hash
    const initialHash = window.location.hash.substring(1);
    if (initialHash && document.getElementById(initialHash)) {
        showPage(initialHash);
        const targetNavLink = document.querySelector(`[data-page="${initialHash}"]`);
        if (targetNavLink) {
            navLinks.forEach(l => l.classList.remove('active'));
            targetNavLink.classList.add('active');
        }
    }
}

// Jobs page functionality
function initializeJobsPage() {
    const searchBtn = document.getElementById('search-jobs');
    const jobSearch = document.getElementById('job-search');
    const locationFilter = document.getElementById('location-filter');
    const typeFilter = document.getElementById('type-filter');

    if (searchBtn) {
        searchBtn.addEventListener('click', filterJobs);
    }

    // Real-time search
    if (jobSearch) {
        jobSearch.addEventListener('input', debounce(filterJobs, 300));
    }
    if (locationFilter) {
        locationFilter.addEventListener('input', debounce(filterJobs, 300));
    }
    if (typeFilter) {
        typeFilter.addEventListener('change', filterJobs);
    }
}

// Load jobs from API
async function loadJobs() {
    try {
        showLoading();
        const response = await fetch(`${API_BASE_URL}/jobs`);
        if (response.ok) {
            jobsData = await response.json();
        } else {
            // Fallback to mock data
            jobsData = getMockJobs();
        }
        displayJobs(jobsData);
    } catch (error) {
        console.error('Error loading jobs:', error);
        jobsData = getMockJobs();
        displayJobs(jobsData);
    } finally {
        hideLoading();
    }
}

// Filter jobs based on search criteria
function filterJobs() {
    const searchTerm = document.getElementById('job-search')?.value.toLowerCase() || '';
    const location = document.getElementById('location-filter')?.value.toLowerCase() || '';
    const type = document.getElementById('type-filter')?.value || '';

    const filteredJobs = jobsData.filter(job => {
        const matchesSearch = job.title.toLowerCase().includes(searchTerm) ||
                             job.company.toLowerCase().includes(searchTerm);
        const matchesLocation = !location || job.location.toLowerCase().includes(location);
        const matchesType = !type || job.type === type;
        
        return matchesSearch && matchesLocation && matchesType;
    });

    displayJobs(filteredJobs);
}

// Display jobs in the UI
function displayJobs(jobs) {
    const jobsList = document.getElementById('jobs-list');
    if (!jobsList) return;

    if (jobs.length === 0) {
        jobsList.innerHTML = '<div class="no-jobs">No jobs found matching your criteria.</div>';
        return;
    }

    jobsList.innerHTML = jobs.map(job => `
        <div class="job-card fade-in-up">
            <div class="job-header">
                <div>
                    <h3 class="job-title">${job.title}</h3>
                    <div class="job-meta">
                        <span><i class="fas fa-building"></i> ${job.company}</span>
                        <span><i class="fas fa-map-marker-alt"></i> ${job.location}</span>
                    </div>
                </div>
                <div>
                    <div class="job-salary">${job.salary}</div>
                    <span class="match-score ${getMatchScoreClass(job.matchScore)}">${job.matchScore}% Match</span>
                </div>
            </div>
            <p class="job-description">${job.description}</p>
            <div class="job-skills">
                ${job.skills.slice(0, 5).map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
            </div>
            <div class="job-footer">
                <div class="job-info">
                    <span><i class="fas fa-clock"></i> ${job.type}</span>
                    <span>${job.postedDate}</span>
                </div>
                <button class="btn btn-primary" onclick="applyToJob(${job.id})">Apply Now</button>
            </div>
        </div>
    `).join('');
}

// Get match score CSS class
function getMatchScoreClass(score) {
    if (score >= 90) return 'match-high';
    if (score >= 70) return 'match-medium';
    return 'match-low';
}

// Apply to job
function applyToJob(jobId) {
    alert(`Application submitted for job ID: ${jobId}`);
}

// Resume Builder functionality
function initializeResumeBuilder() {
    const sectionItems = document.querySelectorAll('.section-item');
    const aiReviewBtn = document.getElementById('ai-review-btn');
    const previewBtn = document.getElementById('preview-btn');
    const downloadBtn = document.getElementById('download-btn');

    // Section navigation
    sectionItems.forEach(item => {
        item.addEventListener('click', function() {
            const section = this.getAttribute('data-section');
            showBuilderSection(section);
            
            sectionItems.forEach(s => s.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // AI Review
    if (aiReviewBtn) {
        aiReviewBtn.addEventListener('click', runAIReview);
    }

    // Preview
    if (previewBtn) {
        previewBtn.addEventListener('click', updatePreview);
    }

    // Download
    if (downloadBtn) {
        downloadBtn.addEventListener('click', downloadResume);
    }

    // Initialize with personal section
    showBuilderSection('personal');
}

// Show builder section
function showBuilderSection(section) {
    currentSection = section;
    const builderForm = document.getElementById('builder-form');
    if (!builderForm) return;

    let formHTML = '';

    switch (section) {
        case 'personal':
            formHTML = `
                <div class="form-section active">
                    <h3>Personal Information</h3>
                    <div class="form-grid">
                        <div class="form-group">
                            <label for="name">Full Name</label>
                            <input type="text" id="name" name="name" value="${resumeData.personal.name}" onchange="updateResumeData('personal', 'name', this.value)">
                        </div>
                        <div class="form-group">
                            <label for="email">Email</label>
                            <input type="email" id="email" name="email" value="${resumeData.personal.email}" onchange="updateResumeData('personal', 'email', this.value)">
                        </div>
                        <div class="form-group">
                            <label for="phone">Phone</label>
                            <input type="tel" id="phone" name="phone" value="${resumeData.personal.phone}" onchange="updateResumeData('personal', 'phone', this.value)">
                        </div>
                        <div class="form-group">
                            <label for="location">Location</label>
                            <input type="text" id="location" name="location" value="${resumeData.personal.location}" onchange="updateResumeData('personal', 'location', this.value)">
                        </div>
                        <div class="form-group">
                            <label for="linkedin">LinkedIn</label>
                            <input type="url" id="linkedin" name="linkedin" value="${resumeData.personal.linkedin}" onchange="updateResumeData('personal', 'linkedin', this.value)">
                        </div>
                        <div class="form-group">
                            <label for="website">Website</label>
                            <input type="url" id="website" name="website" value="${resumeData.personal.website}" onchange="updateResumeData('personal', 'website', this.value)">
                        </div>
                    </div>
                </div>
            `;
            break;

        case 'summary':
            formHTML = `
                <div class="form-section active">
                    <h3>Professional Summary</h3>
                    <div class="form-group">
                        <label for="summary">Summary</label>
                        <textarea id="summary" name="summary" rows="6" placeholder="Write a compelling summary that highlights your key qualifications..." onchange="updateResumeData('summary', null, this.value)">${resumeData.summary}</textarea>
                    </div>
                    <div class="ai-tip">
                        <h4><i class="fas fa-lightbulb"></i> AI Tip</h4>
                        <p>Include 2-3 key achievements with specific numbers or percentages to make your summary more impactful.</p>
                    </div>
                </div>
            `;
            break;

        case 'experience':
            formHTML = `
                <div class="form-section active">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                        <h3>Work Experience</h3>
                        <button type="button" class="add-btn" onclick="addExperience()">
                            <i class="fas fa-plus"></i> Add Experience
                        </button>
                    </div>
                    <div id="experience-list">
                        ${resumeData.experience.map((exp, index) => createExperienceForm(exp, index)).join('')}
                    </div>
                </div>
            `;
            break;

        case 'education':
            formHTML = `
                <div class="form-section active">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                        <h3>Education</h3>
                        <button type="button" class="add-btn" onclick="addEducation()">
                            <i class="fas fa-plus"></i> Add Education
                        </button>
                    </div>
                    <div id="education-list">
                        ${resumeData.education.map((edu, index) => createEducationForm(edu, index)).join('')}
                    </div>
                </div>
            `;
            break;

        case 'skills':
            formHTML = `
                <div class="form-section active">
                    <h3>Skills</h3>
                    <div class="form-group">
                        <label for="skill-input">Add Skills</label>
                        <div class="skills-container" id="skills-container">
                            ${resumeData.skills.map((skill, index) => `
                                <span class="skill-item">
                                    ${skill}
                                    <button type="button" class="skill-remove" onclick="removeSkill(${index})">×</button>
                                </span>
                            `).join('')}
                        </div>
                        <input type="text" id="skill-input" placeholder="Type a skill and press Enter" onkeypress="addSkill(event)">
                    </div>
                </div>
            `;
            break;
    }

    builderForm.innerHTML = formHTML;
    updatePreview();
}

// Update resume data
function updateResumeData(section, field, value) {
    if (section === 'summary') {
        resumeData.summary = value;
    } else if (field) {
        resumeData[section][field] = value;
    }
    updatePreview();
}

// Create experience form
function createExperienceForm(exp, index) {
    return `
        <div class="experience-item">
            <button type="button" class="remove-btn" onclick="removeExperience(${index})">
                <i class="fas fa-trash"></i>
            </button>
            <div class="form-grid">
                <div class="form-group">
                    <label>Job Title</label>
                    <input type="text" value="${exp.title || ''}" onchange="updateExperience(${index}, 'title', this.value)">
                </div>
                <div class="form-group">
                    <label>Company</label>
                    <input type="text" value="${exp.company || ''}" onchange="updateExperience(${index}, 'company', this.value)">
                </div>
                <div class="form-group">
                    <label>Start Date</label>
                    <input type="month" value="${exp.startDate || ''}" onchange="updateExperience(${index}, 'startDate', this.value)">
                </div>
                <div class="form-group">
                    <label>End Date</label>
                    <input type="text" value="${exp.endDate || ''}" placeholder="Present" onchange="updateExperience(${index}, 'endDate', this.value)">
                </div>
            </div>
            <div class="form-group">
                <label>Description</label>
                <textarea rows="4" onchange="updateExperience(${index}, 'description', this.value)">${exp.description || ''}</textarea>
            </div>
        </div>
    `;
}

// Create education form
function createEducationForm(edu, index) {
    return `
        <div class="education-item">
            <button type="button" class="remove-btn" onclick="removeEducation(${index})">
                <i class="fas fa-trash"></i>
            </button>
            <div class="form-grid">
                <div class="form-group">
                    <label>Degree</label>
                    <input type="text" value="${edu.degree || ''}" onchange="updateEducation(${index}, 'degree', this.value)">
                </div>
                <div class="form-group">
                    <label>School</label>
                    <input type="text" value="${edu.school || ''}" onchange="updateEducation(${index}, 'school', this.value)">
                </div>
                <div class="form-group">
                    <label>Start Date</label>
                    <input type="month" value="${edu.startDate || ''}" onchange="updateEducation(${index}, 'startDate', this.value)">
                </div>
                <div class="form-group">
                    <label>End Date</label>
                    <input type="month" value="${edu.endDate || ''}" onchange="updateEducation(${index}, 'endDate', this.value)">
                </div>
            </div>
        </div>
    `;
}

// Experience management
function addExperience() {
    resumeData.experience.push({
        title: '',
        company: '',
        startDate: '',
        endDate: '',
        description: ''
    });
    showBuilderSection('experience');
}

function removeExperience(index) {
    resumeData.experience.splice(index, 1);
    showBuilderSection('experience');
}

function updateExperience(index, field, value) {
    resumeData.experience[index][field] = value;
    updatePreview();
}

// Education management
function addEducation() {
    resumeData.education.push({
        degree: '',
        school: '',
        startDate: '',
        endDate: ''
    });
    showBuilderSection('education');
}

function removeEducation(index) {
    resumeData.education.splice(index, 1);
    showBuilderSection('education');
}

function updateEducation(index, field, value) {
    resumeData.education[index][field] = value;
    updatePreview();
}

// Skills management
function addSkill(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        const skillInput = event.target;
        const skill = skillInput.value.trim();
        
        if (skill && !resumeData.skills.includes(skill)) {
            resumeData.skills.push(skill);
            skillInput.value = '';
            showBuilderSection('skills');
        }
    }
}

function removeSkill(index) {
    resumeData.skills.splice(index, 1);
    showBuilderSection('skills');
}

// Update preview
function updatePreview() {
    const previewName = document.getElementById('preview-name');
    const previewEmail = document.getElementById('preview-email');
    const previewPhone = document.getElementById('preview-phone');
    const previewSummary = document.getElementById('preview-summary');
    const previewExperience = document.getElementById('preview-experience');
    const previewSkills = document.getElementById('preview-skills');

    if (previewName) previewName.textContent = resumeData.personal.name || 'Your Name';
    if (previewEmail) previewEmail.textContent = resumeData.personal.email || 'your.email@example.com';
    if (previewPhone) previewPhone.textContent = resumeData.personal.phone || '+1 (555) 123-4567';
    if (previewSummary) previewSummary.textContent = resumeData.summary || 'Your professional summary will appear here...';

    if (previewExperience) {
        if (resumeData.experience.length > 0) {
            previewExperience.innerHTML = resumeData.experience.map(exp => `
                <div style="margin-bottom: 1rem;">
                    <div style="font-weight: 600;">${exp.title || 'Job Title'}</div>
                    <div style="color: #6b7280; font-size: 0.875rem;">${exp.company || 'Company'}</div>
                    <div style="color: #6b7280; font-size: 0.75rem;">${exp.startDate || 'Start'} - ${exp.endDate || 'End'}</div>
                </div>
            `).join('');
        } else {
            previewExperience.textContent = 'Your experience will appear here...';
        }
    }

    if (previewSkills) {
        if (resumeData.skills.length > 0) {
            previewSkills.innerHTML = resumeData.skills.slice(0, 6).map(skill => 
                `<span class="skill-tag" style="margin: 0.125rem;">${skill}</span>`
            ).join('');
        } else {
            previewSkills.textContent = 'Your skills will appear here...';
        }
    }
}

// AI Review functionality
async function runAIReview() {
    try {
        showLoading();
        const response = await fetch(`${API_BASE_URL}/ai-review`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(resumeData)
        });

        let suggestions = [];
        if (response.ok) {
            const result = await response.json();
            suggestions = result.suggestions || [];
        } else {
            // Fallback to mock suggestions
            suggestions = getMockAISuggestions();
        }

        displayAISuggestions(suggestions);
    } catch (error) {
        console.error('Error running AI review:', error);
        displayAISuggestions(getMockAISuggestions());
    } finally {
        hideLoading();
    }
}

// Display AI suggestions
function displayAISuggestions(suggestions) {
    const aiSuggestions = document.getElementById('ai-suggestions');
    const suggestionsList = document.getElementById('suggestions-list');
    
    if (aiSuggestions && suggestionsList) {
        suggestionsList.innerHTML = suggestions.map(suggestion => 
            `<li>• ${suggestion}</li>`
        ).join('');
        aiSuggestions.style.display = 'block';
    }
}

// Download resume
async function downloadResume() {
    try {
        showLoading();
        const response = await fetch(`${API_BASE_URL}/generate-resume`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(resumeData)
        });

        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'resume.pdf';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } else {
            alert('Resume download is not available. Please try again later.');
        }
    } catch (error) {
        console.error('Error downloading resume:', error);
        alert('Resume download is not available. Please try again later.');
    } finally {
        hideLoading();
    }
}

// ATS Score functionality
function initializeATSScore() {
    const uploadArea = document.getElementById('upload-area');
    const resumeUpload = document.getElementById('resume-upload');
    const analyzeBtn = document.getElementById('analyze-btn');

    if (uploadArea && resumeUpload) {
        // Drag and drop functionality
        uploadArea.addEventListener('dragover', function(e) {
            e.preventDefault();
            this.style.borderColor = '#3b82f6';
        });

        uploadArea.addEventListener('dragleave', function(e) {
            e.preventDefault();
            this.style.borderColor = '#d1d5db';
        });

        uploadArea.addEventListener('drop', function(e) {
            e.preventDefault();
            this.style.borderColor = '#d1d5db';
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                handleFileUpload(files[0]);
            }
        });

        resumeUpload.addEventListener('change', function(e) {
            if (e.target.files.length > 0) {
                handleFileUpload(e.target.files[0]);
            }
        });
    }

    if (analyzeBtn) {
        analyzeBtn.addEventListener('click', analyzeResume);
    }
}

// Handle file upload
function handleFileUpload(file) {
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!allowedTypes.includes(file.type)) {
        alert('Please upload a PDF, DOC, or DOCX file.');
        return;
    }

    if (file.size > maxSize) {
        alert('File size must be less than 10MB.');
        return;
    }

    const uploadLabel = document.querySelector('.upload-label span');
    const analyzeBtn = document.getElementById('analyze-btn');
    
    if (uploadLabel) {
        uploadLabel.textContent = file.name;
    }
    
    if (analyzeBtn) {
        analyzeBtn.style.display = 'block';
        analyzeBtn.setAttribute('data-file', file.name);
    }
}

// Analyze resume
async function analyzeResume() {
    try {
        showLoading();
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        const mockResults = getMockATSResults();
        displayATSResults(mockResults);
        
        // Hide upload section and show results
        const uploadSection = document.getElementById('upload-section');
        const resultsSection = document.getElementById('results-section');
        
        if (uploadSection) uploadSection.style.display = 'none';
        if (resultsSection) resultsSection.style.display = 'block';
        
    } catch (error) {
        console.error('Error analyzing resume:', error);
        alert('Analysis failed. Please try again.');
    } finally {
        hideLoading();
    }
}

// Display ATS results
function displayATSResults(results) {
    const resultsSection = document.getElementById('results-section');
    if (!resultsSection) return;

    const scoreClass = getScoreClass(results.score);
    const gradeClass = getGradeClass(results.grade);

    resultsSection.innerHTML = `
        <div class="score-display">
            <div class="score-number ${scoreClass}">${results.score}</div>
            <div class="score-label">ATS Score</div>
            <div class="score-grade ${gradeClass}">Grade: ${results.grade}</div>
        </div>
        
        <div class="results-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-top: 2rem;">
            <div class="results-card">
                <h3>Section Analysis</h3>
                <div class="sections-analysis">
                    ${Object.entries(results.sections).map(([section, data]) => `
                        <div class="section-result" style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; border: 1px solid #e5e7eb; border-radius: 8px; margin-bottom: 0.5rem;">
                            <span style="text-transform: capitalize; font-weight: 500;">${section}</span>
                            <span class="${getScoreClass(data.score)}" style="font-weight: 600;">${data.score}%</span>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <div class="results-card">
                <h3>Improvement Suggestions</h3>
                <ul class="suggestions-list" style="list-style: none; padding: 0;">
                    ${results.suggestions.map(suggestion => `
                        <li style="display: flex; align-items: flex-start; margin-bottom: 0.75rem;">
                            <i class="fas fa-chart-line" style="color: #3b82f6; margin-right: 0.75rem; margin-top: 0.125rem;"></i>
                            <span style="color: #6b7280; line-height: 1.5;">${suggestion}</span>
                        </li>
                    `).join('')}
                </ul>
            </div>
        </div>
        
        <div class="results-actions" style="text-align: center; margin-top: 2rem;">
            <button class="btn btn-primary" onclick="resetATSAnalysis()" style="margin-right: 1rem;">
                Upload Another Resume
            </button>
            <button class="btn btn-secondary" data-page="resume-builder">
                Optimize in Resume Builder
            </button>
        </div>
    `;
}

// Reset ATS analysis
function resetATSAnalysis() {
    const uploadSection = document.getElementById('upload-section');
    const resultsSection = document.getElementById('results-section');
    const resumeUpload = document.getElementById('resume-upload');
    const analyzeBtn = document.getElementById('analyze-btn');
    const uploadLabel = document.querySelector('.upload-label span');
    
    if (uploadSection) uploadSection.style.display = 'grid';
    if (resultsSection) resultsSection.style.display = 'none';
    if (resumeUpload) resumeUpload.value = '';
    if (analyzeBtn) analyzeBtn.style.display = 'none';
    if (uploadLabel) uploadLabel.textContent = 'Click to upload or drag and drop';
}

// Get score CSS class
function getScoreClass(score) {
    if (score >= 90) return 'score-excellent';
    if (score >= 70) return 'score-good';
    if (score >= 50) return 'score-fair';
    return 'score-poor';
}

// Get grade CSS class
function getGradeClass(grade) {
    if (grade === 'A') return 'grade-excellent';
    if (grade === 'B') return 'grade-good';
    if (grade === 'C') return 'grade-fair';
    return 'grade-poor';
}

// Contact form functionality
function initializeContactForm() {
    const contactForm = document.getElementById('contact-form');
    
    if (contactForm) {
        contactForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            const data = Object.fromEntries(formData.entries());
            
            try {
                showLoading();
                
                const response = await fetch(`${API_BASE_URL}/contact`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                });
                
                if (response.ok) {
                    alert('Thank you for your message! We\'ll get back to you soon.');
                    this.reset();
                } else {
                    throw new Error('Failed to send message');
                }
            } catch (error) {
                console.error('Error sending message:', error);
                alert('Thank you for your message! We\'ll get back to you soon.');
                this.reset();
            } finally {
                hideLoading();
            }
        });
    }
}

// Utility functions
function showLoading() {
    const loadingOverlay = document.getElementById('loading-overlay');
    if (loadingOverlay) {
        loadingOverlay.classList.add('active');
    }
}

function hideLoading() {
    const loadingOverlay = document.getElementById('loading-overlay');
    if (loadingOverlay) {
        loadingOverlay.classList.remove('active');
    }
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Mock data functions (fallbacks when API is not available)
function getMockJobs() {
    return [
        {
            id: 1,
            title: 'Senior Frontend Developer',
            company: 'TechCorp Inc.',
            location: 'San Francisco, CA',
            type: 'Full-time',
            salary: '$120,000 - $150,000',
            postedDate: '2 days ago',
            matchScore: 92,
            description: 'We are looking for a Senior Frontend Developer to join our growing team. You will be responsible for building user-facing features using React, TypeScript, and modern web technologies.',
            skills: ['React', 'TypeScript', 'CSS', 'JavaScript', 'Redux', 'GraphQL', 'Jest', 'Webpack']
        },
        {
            id: 2,
            title: 'Full Stack Engineer',
            company: 'StartupXYZ',
            location: 'Remote',
            type: 'Full-time',
            salary: '$100,000 - $130,000',
            postedDate: '1 week ago',
            matchScore: 85,
            description: 'Join our fast-growing startup as a Full Stack Engineer. Work on both frontend and backend systems, building scalable applications that serve millions of users.',
            skills: ['Node.js', 'React', 'MongoDB', 'AWS', 'Docker', 'TypeScript', 'Express', 'Git']
        },
        {
            id: 3,
            title: 'Data Scientist',
            company: 'DataFlow Analytics',
            location: 'New York, NY',
            type: 'Full-time',
            salary: '$110,000 - $140,000',
            postedDate: '3 days ago',
            matchScore: 78,
            description: 'We are seeking a Data Scientist to join our analytics team. You will work on machine learning models, data analysis, and business intelligence solutions.',
            skills: ['Python', 'Machine Learning', 'SQL', 'TensorFlow', 'Pandas', 'Scikit-learn', 'R', 'Tableau']
        },
        {
            id: 4,
            title: 'DevOps Engineer',
            company: 'CloudTech Solutions',
            location: 'Austin, TX',
            type: 'Full-time',
            salary: '$115,000 - $145,000',
            postedDate: '5 days ago',
            matchScore: 82,
            description: 'Looking for a DevOps Engineer to manage our cloud infrastructure, CI/CD pipelines, and automation tools. Help us scale our platform efficiently.',
            skills: ['AWS', 'Docker', 'Kubernetes', 'Terraform', 'Jenkins', 'Python', 'Linux', 'Git']
        },
        {
            id: 5,
            title: 'UX Designer',
            company: 'DesignCo',
            location: 'Los Angeles, CA',
            type: 'Full-time',
            salary: '$90,000 - $120,000',
            postedDate: '1 day ago',
            matchScore: 75,
            description: 'Join our design team to create beautiful and intuitive user experiences. Work closely with product managers and engineers to deliver exceptional digital products.',
            skills: ['Figma', 'Sketch', 'Prototyping', 'User Research', 'Wireframing', 'Adobe Creative Suite', 'HTML/CSS']
        }
    ];
}

function getMockAISuggestions() {
    return [
        'Add quantified achievements to demonstrate impact (e.g., "Increased sales by 25%")',
        'Include more industry-specific keywords from job descriptions',
        'Use stronger action verbs to start bullet points (e.g., "Spearheaded", "Orchestrated")',
        'Consider adding a technical skills section to highlight relevant technologies',
        'Ensure consistent formatting and spacing throughout the document'
    ];
}

function getMockATSResults() {
    return {
        score: 78,
        grade: 'B+',
        sections: {
            formatting: { score: 85, status: 'good' },
            keywords: { score: 72, status: 'warning' },
            length: { score: 90, status: 'good' },
            contact: { score: 95, status: 'excellent' },
            experience: { score: 68, status: 'warning' },
            education: { score: 80, status: 'good' }
        },
        suggestions: [
            'Add more industry-specific keywords from job descriptions',
            'Include quantified achievements (numbers, percentages, dollar amounts)',
            'Use stronger action verbs to start bullet points',
            'Add a skills section with relevant technical skills',
            'Ensure consistent formatting throughout the document'
        ]
    };
}