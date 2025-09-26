// Global Variables
let allPosts = [];
let displayedPosts = [];
let currentFilter = 'all';
let currentSearch = '';
let postsPerPage = 6;
let currentPage = 1;

// DOM Elements
const blogGrid = document.getElementById('blog-grid');
const searchInput = document.getElementById('search-input');
const categoryFilter = document.getElementById('category-filter');
const loadMoreBtn = document.getElementById('load-more');
const themeToggle = document.getElementById('theme-toggle');
const navToggle = document.getElementById('nav-toggle');
const navMenu = document.getElementById('nav-menu');
const scrollTopBtn = document.getElementById('scroll-top');
const modal = document.getElementById('post-modal');
const modalClose = document.querySelector('.modal-close');

// Initialize App
document.addEventListener('DOMContentLoaded', function() {
    initializeTheme();
    loadBlogPosts();
    setupEventListeners();
    setupScrollEffects();
    setupSmoothScrolling();
});

// Theme Management
function initializeTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
}

function updateThemeIcon(theme) {
    const icon = themeToggle.querySelector('i');
    icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
}

// Load Blog Posts
async function loadBlogPosts() {
    try {
        const response = await fetch('posts.json');
        allPosts = await response.json();
        displayedPosts = [...allPosts];
        renderPosts();
        updateLoadMoreButton();
    } catch (error) {
        console.error('Error loading blog posts:', error);
        showErrorMessage();
    }
}

// Render Posts
function renderPosts(reset = false) {
    if (reset) {
        currentPage = 1;
        blogGrid.innerHTML = '';
    }

    const startIndex = (currentPage - 1) * postsPerPage;
    const endIndex = startIndex + postsPerPage;
    const postsToShow = displayedPosts.slice(startIndex, endIndex);

    if (postsToShow.length === 0 && currentPage === 1) {
        showNoResultsMessage();
        return;
    }

    postsToShow.forEach((post, index) => {
        const postCard = createPostCard(post);
        postCard.style.animationDelay = `${index * 0.1}s`;
        blogGrid.appendChild(postCard);
    });

    updateLoadMoreButton();
}

// Create Post Card
function createPostCard(post) {
    const card = document.createElement('div');
    card.className = 'blog-card fade-in';
    card.innerHTML = `
        <img src="images/${post.image}" alt="${post.title}" class="blog-card-image" loading="lazy">
        <div class="blog-card-content">
            <div class="blog-card-meta">
                <span class="category-tag">${post.category}</span>
                <span>${post.author}</span>
                <span>${formatDate(post.date)}</span>
            </div>
            <h3 class="blog-card-title">${post.title}</h3>
            <p class="blog-card-snippet">${post.snippet}</p>
            <div class="tags">
                ${post.tags.map(tag => `<span class="tag">#${tag}</span>`).join('')}
            </div>
            <div class="blog-card-actions">
                <button class="btn-preview" onclick="openPostModal(${post.id})">
                    Preview
                </button>
                <div class="social-share">
                    <button class="share-btn" onclick="sharePost('${post.title}', '${post.snippet}')" title="Share">
                        <i class="fas fa-share-alt"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
    return card;
}

// Filter and Search Functions
function filterPosts() {
    let filtered = [...allPosts];

    // Apply category filter
    if (currentFilter !== 'all') {
        filtered = filtered.filter(post => post.category === currentFilter);
    }

    // Apply search filter
    if (currentSearch) {
        const searchTerm = currentSearch.toLowerCase();
        filtered = filtered.filter(post => 
            post.title.toLowerCase().includes(searchTerm) ||
            post.snippet.toLowerCase().includes(searchTerm) ||
            post.tags.some(tag => tag.toLowerCase().includes(searchTerm)) ||
            post.author.toLowerCase().includes(searchTerm)
        );
    }

    displayedPosts = filtered;
    blogGrid.innerHTML = '';
    currentPage = 1;
    renderPosts();
}

// Modal Functions
function openPostModal(postId) {
    const post = allPosts.find(p => p.id === postId);
    if (!post) return;

    document.getElementById('modal-image').src = `images/${post.image}`;
    document.getElementById('modal-title').textContent = post.title;
    document.getElementById('modal-author').textContent = post.author;
    document.getElementById('modal-date').textContent = formatDate(post.date);
    document.getElementById('modal-category').textContent = post.category;
    document.getElementById('modal-snippet').textContent = post.content || post.snippet;
    
    const tagsContainer = document.getElementById('modal-tags');
    tagsContainer.innerHTML = post.tags.map(tag => `<span class="tag">#${tag}</span>`).join('');

    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';

    // Setup modal read more button
    document.getElementById('modal-read-more').onclick = () => {
        // In a real application, this would navigate to the full post
        alert(`This would open the full article: "${post.title}"`);
    };
}

function closePostModal() {
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Utility Functions
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
}

function updateLoadMoreButton() {
    const totalShown = currentPage * postsPerPage;
    const hasMore = totalShown < displayedPosts.length;
    
    loadMoreBtn.style.display = hasMore ? 'block' : 'none';
}

function loadMorePosts() {
    currentPage++;
    renderPosts();
}

function sharePost(title, snippet) {
    if (navigator.share) {
        navigator.share({
            title: title,
            text: snippet,
            url: window.location.href
        });
    } else {
        // Fallback for browsers that don't support Web Share API
        const text = `Check out this article: ${title} - ${snippet}`;
        navigator.clipboard.writeText(text).then(() => {
            showNotification('Link copied to clipboard!');
        });
    }
}

function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: var(--primary-color);
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 0.5rem;
        box-shadow: var(--shadow-medium);
        z-index: 2000;
        animation: slideInRight 0.3s ease-out;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

function showErrorMessage() {
    blogGrid.innerHTML = `
        <div class="error-message" style="grid-column: 1 / -1; text-align: center; padding: 3rem;">
            <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: var(--accent-color); margin-bottom: 1rem;"></i>
            <h3>Oops! Something went wrong</h3>
            <p>We couldn't load the blog posts. Please try again later.</p>
            <button onclick="loadBlogPosts()" class="btn-primary" style="margin-top: 1rem;">
                Try Again
            </button>
        </div>
    `;
}

function showNoResultsMessage() {
    blogGrid.innerHTML = `
        <div class="no-results" style="grid-column: 1 / -1; text-align: center; padding: 3rem;">
            <i class="fas fa-search" style="font-size: 3rem; color: var(--text-secondary); margin-bottom: 1rem;"></i>
            <h3>No posts found</h3>
            <p>Try adjusting your search or filter criteria.</p>
            <button onclick="clearFilters()" class="btn-primary" style="margin-top: 1rem;">
                Clear Filters
            </button>
        </div>
    `;
}

function clearFilters() {
    searchInput.value = '';
    categoryFilter.value = 'all';
    currentSearch = '';
    currentFilter = 'all';
    filterPosts();
}

// Event Listeners Setup
function setupEventListeners() {
    // Theme toggle
    themeToggle.addEventListener('click', toggleTheme);

    // Navigation toggle
    navToggle.addEventListener('click', () => {
        navMenu.classList.toggle('active');
    });

    // Close nav menu when clicking on links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('active');
        });
    });

    // Search functionality
    searchInput.addEventListener('input', debounce((e) => {
        currentSearch = e.target.value.trim();
        filterPosts();
    }, 300));

    // Category filter
    categoryFilter.addEventListener('change', (e) => {
        currentFilter = e.target.value;
        filterPosts();
    });

    // Load more button
    loadMoreBtn.addEventListener('click', loadMorePosts);

    // Modal events
    modalClose.addEventListener('click', closePostModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closePostModal();
        }
    });

    // Keyboard events
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.style.display === 'block') {
            closePostModal();
        }
    });

    // Footer category links
    document.querySelectorAll('[data-category]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const category = e.target.getAttribute('data-category');
            categoryFilter.value = category;
            currentFilter = category;
            filterPosts();
            document.getElementById('blog').scrollIntoView({ behavior: 'smooth' });
        });
    });

    // Social share buttons in modal
    document.querySelectorAll('.share-btn[data-platform]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const platform = e.currentTarget.getAttribute('data-platform');
            const title = document.getElementById('modal-title').textContent;
            const url = window.location.href;
            
            let shareUrl = '';
            switch(platform) {
                case 'twitter':
                    shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`;
                    break;
                case 'facebook':
                    shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
                    break;
                case 'linkedin':
                    shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
                    break;
            }
            
            if (shareUrl) {
                window.open(shareUrl, '_blank', 'width=600,height=400');
            }
        });
    });
}

// Scroll Effects
function setupScrollEffects() {
    let lastScrollTop = 0;
    const header = document.querySelector('.header');

    window.addEventListener('scroll', () => {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        // Header hide/show on scroll
        if (scrollTop > lastScrollTop && scrollTop > 100) {
            header.style.transform = 'translateY(-100%)';
        } else {
            header.style.transform = 'translateY(0)';
        }
        lastScrollTop = scrollTop;

        // Scroll to top button
        if (scrollTop > 300) {
            scrollTopBtn.classList.add('visible');
        } else {
            scrollTopBtn.classList.remove('visible');
        }

        // Update active nav link based on scroll position
        updateActiveNavLink();
    });

    // Scroll to top functionality
    scrollTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// Smooth Scrolling for Navigation
function setupSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const headerHeight = document.querySelector('.header').offsetHeight;
                const targetPosition = target.offsetTop - headerHeight;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// Update Active Navigation Link
function updateActiveNavLink() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');
    
    let current = '';
    const scrollPosition = window.pageYOffset + 100;

    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        
        if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
            current = section.getAttribute('id');
        }
    });

    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${current}`) {
            link.classList.add('active');
        }
    });
}

// Debounce Function
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

// Intersection Observer for Animations
function setupIntersectionObserver() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in');
            }
        });
    }, observerOptions);

    // Observe elements that should animate on scroll
    document.querySelectorAll('.stat, .blog-card').forEach(el => {
        observer.observe(el);
    });
}

// Initialize intersection observer after DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(setupIntersectionObserver, 1000);
});

// Service Worker Registration (for PWA capabilities)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}
