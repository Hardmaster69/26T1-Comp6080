import { BACKEND_PORT } from './config.js';
// A helper you may want to use when uploading new images to the server.
import { fileToDataUrl } from './helpers.js';

console.log('Let\'s go!');

import { createElement, apiCall, formatTime } from './helpers.js';
window.apiCall = apiCall;

// main div
const pageContents = document.getElementById('page-contents');
let currentPollingInterval = null; // timer for check message, prevent mem-leak

// login function
const showLogin = () => {
    pageContents.innerText = ''; // clear

    // for login
    const emailInput = createElement('input', { id: 'login-email', type: 'email', placeholder: 'Email' });
    const passwordInput = createElement('input', { id: 'login-password', type: 'password', placeholder: 'Password' });
    const loginBtn = createElement('button', { id: 'login-submit' }, 'Login');
    
    const loginSection = createElement('section', { className: 'login-section' }, [
        createElement('h2', {}, 'Login'),
        emailInput,
        passwordInput,
        loginBtn,
        createElement('p', {}, 'New user? '),
        createElement('button', { 
            id: 'register-link', 
            onclick: () => showRegister()
        }, 'Register here') // register entry
    ]);

    pageContents.appendChild(loginSection);

    // login btn reaction
    document.getElementById('login-submit').onclick = () => {
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        // login api structure
        const body = {
            email: email,
            password: password
        };

        // post login request
        apiCall('/auth/login', 'POST', { email, password })
            .then(data => {
                // if success
                localStorage.setItem('token', data.token);
                localStorage.setItem('currentUserId', data.userId);
                return apiCall(`/user?userId=${data.userId}`, 'GET');
            })
            .then(userData => {
                // get admin
                localStorage.setItem('isAdmin', userData.admin);
                window.location.hash = ''; 
                handleRouting();
            })
            .catch(err => {
                // if fail
                showError(err.message); 
            });
    };
};

const showError = (message) => {
    const errorContainer = document.getElementById('error-container');
    const errorMessage = document.getElementById('error-message');
    
    errorMessage.innerText = message; // innertext
    errorContainer.style.display = 'block'; // pop-up window

    // close-btn
    document.getElementById('error-close').onclick = () => {
        errorContainer.style.display = 'none';
    };
};

// pop-out message card
const showToast = (message) => {
    // pop-out card div
    const toast = createElement('div', {
        style: 'position: fixed; bottom: 20px; left: 20px; background-color: #1da1f2; color: white; padding: 15px 25px; border-radius: 5px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); z-index: 9999; font-weight: bold; transition: opacity 0.3s; opacity: 1;'
    }, message);
    
    document.body.appendChild(toast);

    // remove in 3s
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => {
            if (document.body.contains(toast)) {
                document.body.removeChild(toast);
            }
        }, 300); 
    }, 3000);
};

// register funtion
const showRegister = () => {
    pageContents.innerText = ''; 

    // register post structure
    const emailInput = createElement('input', { id: 'register-email', type: 'email', placeholder: 'Email' });
    const nameInput = createElement('input', { id: 'register-name', type: 'text', placeholder: 'Full Name' });
    const passwordInput = createElement('input', { id: 'register-password', type: 'password', placeholder: 'Password' });
    const confirmInput = createElement('input', { id: 'register-confirm-password', type: 'password', placeholder: 'Confirm Password' });
    const registerBtn = createElement('button', { id: 'register-submit' }, 'Register');
    
    const registerSection = createElement('section', { className: 'auth-section' }, [
        createElement('h2', {}, 'Create Account'),
        emailInput,
        nameInput,
        passwordInput,
        confirmInput,
        registerBtn,
        createElement('p', {}, 'Already have an account? '),
        createElement('button', { id: 'goto-login' }, 'Back to Login')
    ]);

    pageContents.appendChild(registerSection);

    // to login
    document.getElementById('goto-login').onclick = () => showLogin();

    // register
    registerBtn.onclick = () => {
        const email = emailInput.value;
        const name = nameInput.value;
        const password = passwordInput.value;
        const confirmPassword = confirmInput.value;

        // check the password
        if (password !== confirmPassword) {
            showError("Passwords do not match.");
            return;
        }

        const body = { email, password, name };
        
        apiCall('/auth/register', 'POST', body)
        .then(data => {
            localStorage.setItem('token', data.token);
            localStorage.setItem('currentUserId', data.userId);
            return apiCall(`/user?userId=${data.userId}`, 'GET');
        })
        .then(userData => {
                // get admin
                localStorage.setItem('isAdmin', userData.admin);
                window.location.hash = ''; 
                handleRouting(); 
            })
        .catch(err => {
            showError(err.message || 'Registration failed.');
        });
    };
};

// logout function
const logout = () => {
    //clear token
    localStorage.removeItem('token');
    localStorage.removeItem('currentUserId');
    
    // clear logout btn
    const nav = document.getElementById('nav-container');
    nav.innerText = '';

    showLogin();
};


// main page
const showDashboard = (targetThreadId = null) => {
    pageContents.innerText = '';
    let currentStart = 0; 

    // navi-bar
    const nav = document.getElementById('nav-container');
    if (nav) {
        nav.innerText = '';
        const createBtn = createElement('button', { id: 'create-thread-button' }, 'Create');
        
        const profileBtn = createElement('button', { 
            id: 'avatar-label', 
            onclick: () => { window.location.hash = '#profile'; }
        }, 'My Profile');
        
        const logoutBtn = createElement('button', { id: 'logout-button', onclick: logout }, 'Logout');
        
        nav.appendChild(createBtn);
        nav.appendChild(profileBtn);
        nav.appendChild(logoutBtn);

        createBtn.onclick = () => { window.location.hash = '#create'; };
    }

    const dashboardContainer = createElement('div', { id: 'dashboard-container' });

    const sidebar = createElement('aside', { id: 'sidebar' });
    const sidebarTitle = createElement('h2', { style: 'padding: 15px; border-bottom: 1px solid #ccc;' }, 'Threads');
    const threadListContainer = createElement('div', { id: 'thread-list-container' }); 
    
    sidebar.appendChild(sidebarTitle);
    sidebar.appendChild(threadListContainer);

    const threadContainer = createElement('main', { id: 'thread-container' });
    const placeholder = createElement('div', { className: 'placeholder', style: 'text-align: center; margin-top: 50px; color: #888;' }, 'Please select a thread to view details');
    threadContainer.appendChild(placeholder);

    dashboardContainer.appendChild(sidebar);
    dashboardContainer.appendChild(threadContainer);
    pageContents.appendChild(dashboardContainer);

    // add more thread
    const moreBtn = createElement('button', { id: 'list-more-button', style: 'width: 100%; padding: 10px; display: none;' }, 'Load More');
    sidebar.appendChild(moreBtn);

    // loading threads sign
    const loadingIndicator = createElement('div', { 
        id: 'infinite-scroll-loading', 
        style: 'text-align: center; padding: 15px; color: #888; display: none;' 
    }, 'Fetching more threads...');
    sidebar.appendChild(loadingIndicator);

    // left side threads list
    const showThreadDetail = (thread, card = null, listLikesEl = null) => {
        // do not update the whole page to avoid reload loadmore ptn
        history.pushState(null, null, '#thread=' + thread.id);

        // brighter the thread card when select
        const allCards = threadListContainer.querySelectorAll('.list-thread-container');
        allCards.forEach(c => c.style.backgroundColor = ''); 

        const activeCard = threadListContainer.querySelector(`.list-thread-container[data-thread-id="${thread.id}"]`);
        if (activeCard) {
            activeCard.style.backgroundColor = '#e8f5fe';
        }

        threadContainer.innerText = '';

        const backBtn = createElement('button', { 
            id: 'mobile-back-btn',
            onclick: () => { 
                history.pushState(null, null, ' ');
                dashboardContainer.classList.remove('viewing-detail'); 

                // kill timer
                if (currentPollingInterval) {
                    clearInterval(currentPollingInterval);
                    currentPollingInterval = null;
                }
            }
        }, 'Back to List');

        const titleChildren = [thread.title];

        // if private
        if (!thread.isPublic) {
            const privateBadge = createElement('span', {
                style: 'font-size: 0.5em; background-color: #fff1f0; color: #cf1322; border: 1px solid #ffa39e; padding: 2px 8px; border-radius: 4px; margin-left: 12px; font-weight: normal; vertical-align: middle;'
            }, 'PRIVATE');
            titleChildren.push(privateBadge);
        }

        // if lock
        if (thread.isLocked || thread.lock) {
            const lockBadge = createElement('span', {
                style: 'font-size: 0.5em; background-color: #f0f2f5; color: #65676b; padding: 3px 8px; border-radius: 4px; margin-left: 12px; font-weight: normal; vertical-align: middle;'
            }, 'LOCKED');
            titleChildren.push(lockBadge);
        }

        // add sign next to title
        const detailHeader = createElement('h2', { 
            id: 'thread-title', 
            style: 'display: flex; align-items: center; margin-bottom: 5px;' 
        }, titleChildren);
        const detailAuthor = createElement('p', { // link to profile
            id: 'thread-author', 
            style: 'color: #1da1f2; cursor: pointer; text-decoration: underline;',
            onclick: () => { window.location.hash = '#profile=' + thread.creatorId; }
        }, `Author: ${thread.creatorId}`);
        const detailBody = createElement('p', { id: 'thread-body', style: 'line-height: 1.6; font-size: 1.1em; margin: 20px 0;' }, thread.content);
        const detailLikes = createElement('p', { id: 'thread-likes', style: 'color: #1da1f2;' }, `Likes: ${thread.likes ? thread.likes.length : 0}`);

        // btns
        const actionContainer = createElement('div', { 
            className: 'thread-action-group'
        });

        // get userid
        const currentUserId = parseInt(localStorage.getItem('currentUserId'), 10);

        // like btn
        if (!thread.isLocked) { // check lock
            const isLiked = thread.likes && thread.likes.includes(currentUserId);
            const likeBtn = createElement('button', { 
                id: 'thread-like-toggle',
                style: `padding: 8px 15px; cursor: pointer; border: 1px solid #e0245e; border-radius: 5px; background-color: ${isLiked ? '#e0245e' : 'white'}; color: ${isLiked ? 'white' : '#e0245e'};`
            }, isLiked ? 'Unlike' : 'Like');

            likeBtn.onclick = () => {
                apiCall('/thread/like', 'PUT', { id: thread.id, turnon: !isLiked })
                    .then(() => {
                        if (isLiked) {
                            thread.likes = thread.likes.filter(id => id !== currentUserId);
                        } else {
                            if (!thread.likes) thread.likes = [];
                            thread.likes.push(currentUserId);
                        }
                        
                        if (listLikesEl) listLikesEl.innerText = `Likes: ${thread.likes.length}`;
                        if (card) card.click(); 
                        else showThreadDetail(thread); 
                    })
                    .catch(err => showError(err.message));
            };
            actionContainer.appendChild(likeBtn);
        }

        // watch btn
        const isWatched = thread.watchees && thread.watchees.includes(currentUserId);
        const watchBtn = createElement('button', { 
            id: 'thread-watch-toggle',
            style: `padding: 8px 15px; cursor: pointer; border: 1px solid #1da1f2; border-radius: 5px; background-color: ${isWatched ? '#1da1f2' : 'white'}; color: ${isWatched ? 'white' : '#1da1f2'};`
        }, isWatched ? 'Unwatch' : 'Watch');

        watchBtn.onclick = () => {
            apiCall('/thread/watch', 'PUT', { id: thread.id, turnon: !isWatched })
                .then(() => {
                    if (isWatched) {
                        thread.watchees = thread.watchees.filter(id => id !== currentUserId);
                    } else {
                        if (!thread.watchees) thread.watchees = [];
                        thread.watchees.push(currentUserId);
                    }
                    if (card) card.click();
                    else showThreadDetail(thread);
                })
                .catch(err => showError(err.message));
        };
        actionContainer.appendChild(watchBtn);

        // check admin
        const isAdmin = localStorage.getItem('isAdmin') === 'true';
        const isCreator = currentUserId === thread.creatorId;

        // admin or auth only btn
        if (isAdmin || isCreator) {
            const editBtn = createElement('button', {
                id: 'thread-edit-button',
                style: 'padding: 8px 15px; cursor: pointer; border: 1px solid #ffad1f; border-radius: 5px; background-color: white; color: #ffad1f;'
            }, 'Edit');

            editBtn.onclick = () => {
                window.location.hash = '#edit=' + thread.id;
            };

            const deleteBtn = createElement('button', {
                id: 'thread-delete-button', 
                style: 'padding: 8px 15px; cursor: pointer; border: 1px solid #e0245e; border-radius: 5px; background-color: white; color: #e0245e;'
            }, 'Delete');

            deleteBtn.onclick = () => {
                if (confirm('Are you sure you want to delete this thread?')) {
                    apiCall('/thread', 'DELETE', { id: thread.id })
                        .then(() => {
                            window.location.hash = ''; 
                            handleRouting(); 
                        })
                        .catch(err => showError(err.message));
                }
            };

            actionContainer.appendChild(editBtn);
            actionContainer.appendChild(deleteBtn);
        }

        threadContainer.appendChild(backBtn);
        threadContainer.appendChild(detailHeader);
        threadContainer.appendChild(detailAuthor);
        threadContainer.appendChild(detailBody);
        threadContainer.appendChild(detailLikes);
        threadContainer.appendChild(actionContainer); 

        // comment area
        const commentsWrapper = createElement('div', { id: 'comment-section', style: 'margin-top: 30px;' });
        const commentsTitle = createElement('h3', {}, 'Comments');
        const commentsContainer = createElement('div', { id: 'comment-list-container' });
        
        commentsWrapper.appendChild(commentsTitle);
        commentsWrapper.appendChild(commentsContainer);
        
        if (!thread.isLocked && !thread.lock) {
            const inputArea = createElement('div', { style: 'margin-top: 20px; border-top: 1px solid #eee; padding-top: 20px;' });
            const textarea = createElement('textarea', { 
                id: 'thread-comment-text', 
                placeholder: 'Write a comment...',
                style: 'width: 100%; height: 80px; padding: 10px;'
            });
            const submitBtn = createElement('button', { 
                id: 'thread-comment-submit',
                style: 'margin-top: 10px; padding: 8px 20px; background: #1da1f2; color: white; border: none; border-radius: 5px;'
            }, 'Comment');

            submitBtn.onclick = () => {
                const content = textarea.value.trim();
                if (!content) return;
                apiCall('/comment', 'POST', { threadId: thread.id, content, parentCommentId: null })
                    .then(() => {
                        textarea.value = '';
                        loadComments();
                    })
                    .catch(err => showError(err.message));
            };

            inputArea.appendChild(textarea);
            inputArea.appendChild(submitBtn);
            commentsWrapper.appendChild(inputArea);
        }

        threadContainer.appendChild(commentsWrapper);

        // load comment
        let currentCommentsString = ''; // for timer update
        const loadComments = () => {
            apiCall(`/comments?threadId=${thread.id}`, 'GET')
                .then(comments => {
                    // change into string to compair diff
                    currentCommentsString = JSON.stringify(comments); 

                    commentsContainer.innerText = ''; 
                    const topLevelComments = comments
                        .filter(c => !c.parentCommentId && !c.parentId)
                        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

                    topLevelComments.forEach(c => {
                        commentsContainer.appendChild(renderComment(c, comments, thread.id, loadComments));
                    });
                });
        };

        loadComments();

        dashboardContainer.classList.add('viewing-detail');

        if (currentPollingInterval) {
            clearInterval(currentPollingInterval);
        }

        // set timer
        currentPollingInterval = setInterval(() => {
            if (document.hidden) return; // pause timer if leave

            apiCall(`/thread?id=${thread.id}`, 'GET')
                .then(latestThread => {
                    // update like
                    const currentLikes = latestThread.likes ? latestThread.likes.length : 0;
                    detailLikes.innerText = `Likes: ${currentLikes}`;
                    if (listLikesEl) listLikesEl.innerText = `Likes: ${currentLikes}`;

                    // update detail and comment if edit
                    if (detailBody.innerText !== latestThread.content) {
                        detailBody.innerText = latestThread.content;
                    }
                    if (detailHeader.firstChild.textContent !== latestThread.title) {
                        detailHeader.firstChild.textContent = latestThread.title;
                    }

                    // use detail string to check update
                    apiCall(`/comments?threadId=${thread.id}`, 'GET')
                        .then(latestComments => {
                            const newCommentsString = JSON.stringify(latestComments);
                            // update if diff
                            if (newCommentsString !== currentCommentsString) {
                                
                                // 🎯 Milestone 2.6.3: Check if it is a new comment on a watched thread
                                const oldComments = currentCommentsString ? JSON.parse(currentCommentsString) : [];
                                const currentUserId = parseInt(localStorage.getItem('currentUserId'), 10);
                                const isWatched = latestThread.watchees && latestThread.watchees.includes(currentUserId);
                                
                                // if watch and new comment, pop-out card
                                if (isWatched && latestComments.length > oldComments.length) {
                                    showToast(`New comment: ${latestThread.title}`);
                                }

                                currentCommentsString = newCommentsString;
                                loadComments(); 
                            }
                        })
                        .catch(() => {});
                })
                .catch(() => {
                    clearInterval(currentPollingInterval);
                });
        }, 2000); // 2s each round
    };


    let isFetchingThreads = false; // for auto load
    let hasMoreThreads = true;
    const loadThreads = (start) => {
        if (isFetchingThreads || !hasMoreThreads) return;
        isFetchingThreads = true;
        loadingIndicator.style.display = 'block'; // touch end
        
        apiCall(`/threads?start=${start}`, 'GET')
            .then(ids => {
                if (ids.length === 0 && start === 0) {
                    threadListContainer.appendChild(createElement('p', { style: 'padding: 15px;' }, 'No threads found.'));
                    moreBtn.style.display = 'none';
                    return [];
                }

                if (ids.length < 5) {
                    hasMoreThreads = false; 
                    moreBtn.style.display = 'none';
                } else {
                    moreBtn.style.display = 'block';
                }

                const detailPromises = ids.map(id => 
                    apiCall(`/thread?id=${id}`, 'GET').then(threadInfo => {
                        threadInfo.id = id;
                        return threadInfo;
                    })
                );
                return Promise.all(detailPromises);
            })
            .then(threads => {
                isFetchingThreads = false; // release lock
                loadingIndicator.style.display = 'none';
                if (!threads || threads.length === 0) return;

                // sort by time
                threads.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

                threads.forEach(thread => {
                    const listLikesEl = createElement('p', { className: 'list-thread-likes' }, `Likes: ${thread.likes ? thread.likes.length : 0}`);
                    const card = createElement('div', { className: 'list-thread-container' }, [
                        createElement('h4', { className: 'list-thread-title' }, (!thread.isPublic ? '[Private] ' : '') + thread.title),
                        createElement('p', { className: 'list-thread-date' }, new Date(thread.createdAt).toLocaleString()),
                        createElement('p', { 
                            className: 'list-thread-author',
                            style: 'cursor: pointer; color: #1da1f2; text-decoration: underline; width: fit-content;', 
                            onclick: (e) => {
                                e.stopPropagation();
                                window.location.hash = '#profile=' + thread.creatorId;
                            }
                        }, `Author: ${thread.creatorId}`),
                        listLikesEl
                    ]);

                    card.setAttribute('data-thread-id', thread.id);
                    card.onclick = () => showThreadDetail(thread, card, listLikesEl);
                    threadListContainer.appendChild(card);

                    // brighter the thread in list when loading
                    const currentHashId = window.location.hash.startsWith('#thread=') ? window.location.hash.split('=')[1] : null;
                    if (currentHashId === String(thread.id)) {
                        card.style.backgroundColor = '#e8f5fe';
                        // roll to thread card
                        card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    }
                });
            })
            .catch(err => {
                isFetchingThreads = false; 
                loadingIndicator.style.display = 'none';
                showError("Failed to load threads: " + err.message);
            });
    };

    // load 5 threads
    loadThreads(currentStart);

    moreBtn.onclick = () => {
        currentStart += 5;
        loadThreads(currentStart);
    };

    // listen to scroll, for auto load
    threadListContainer.addEventListener('scroll', () => {
        const { scrollTop, scrollHeight, clientHeight } = threadListContainer;
        if (scrollTop + clientHeight >= scrollHeight - 10) {
            if (!isFetchingThreads && hasMoreThreads) {
                currentStart += 5;
                loadThreads(currentStart);
            }
        }
    });

    // split the thread detail function
    if (targetThreadId) {
        apiCall(`/thread?id=${targetThreadId}`, 'GET')
            .then(threadInfo => {
                threadInfo.id = targetThreadId;
                showThreadDetail(threadInfo); 
            })
            .catch(err => {
                window.location.hash = ''; 
            });
    }
};


// creat thread
const showCreateThreadScreen = () => {
    pageContents.innerText = ''; 

    // navi-bar
    const nav = document.getElementById('nav-container');
    if (nav) {
        nav.innerText = '';
        const backBtn = createElement('button', { id: 'home-button' }, 'Back to Dashboard');
        
        const profileBtn = createElement('button', { 
            id: 'avatar-label', 
            onclick: () => { window.location.hash = '#profile'; } 
        }, 'My Profile');
        
        const logoutBtn = createElement('button', { id: 'logout-button', onclick: logout }, 'Logout');
        
        nav.appendChild(backBtn);
        nav.appendChild(profileBtn);
        nav.appendChild(logoutBtn);

        backBtn.onclick = () => { window.location.hash = ''; };
    }
    const formContainer = createElement('div', { style: 'max-width: 600px; margin: 40px auto; padding: 20px;' });
    const heading = createElement('h2', { style: 'margin-bottom: 20px;' }, 'Create a New Thread');

    // title
    const titleInput = createElement('input', { 
        id: 'create-thread-title', 
        type: 'text', 
        placeholder: 'Enter thread title...', 
        style: 'width: 100%; margin-bottom: 15px; padding: 10px;' 
    });

    // body
    const bodyInput = createElement('textarea', { 
        id: 'create-thread-body', 
        placeholder: 'What do you want to share?', 
        rows: '8', 
        style: 'width: 100%; margin-bottom: 15px; padding: 10px;' 
    });

    // private checkbox
    const privateWrapper = createElement('div', { 
        style: 'display: flex; align-items: center; margin-bottom: 20px; width: 100%;' 
    });
    const privateCheckbox = createElement('input', { 
        id: 'create-thread-private', 
        type: 'checkbox',
        style: 'width: 16px; height: 16px; margin: 0 10px 0 0; cursor: pointer;' 
    });

    const privateLabel = createElement('label', { 
        htmlFor: 'create-thread-private',
        style: 'font-size: 0.95rem; color: #14171a; cursor: pointer; white-space: nowrap;' 
    }, 'Make this thread private');

    privateWrapper.appendChild(privateCheckbox);
    privateWrapper.appendChild(privateLabel);

    // submit-btn
    const submitBtn = createElement('button', { 
        id: 'create-thread-submit', 
        style: 'padding: 10px 20px; background-color: #1da1f2; color: white; border: none; border-radius: 5px; cursor: pointer;' 
    }, 'Post Thread');

    formContainer.appendChild(heading);
    formContainer.appendChild(titleInput);
    formContainer.appendChild(bodyInput);
    formContainer.appendChild(privateWrapper);
    formContainer.appendChild(submitBtn);
    
    pageContents.appendChild(formContainer);

    // submit
    submitBtn.onclick = () => {
        const title = titleInput.value.trim();
        const content = bodyInput.value.trim();
        const isPublic = !privateCheckbox.checked; 

        if (!title || !content) {
            showError('Title and content cannot be empty.');
            return;
        }

        // post thread
        apiCall('/thread', 'POST', { title, content, isPublic })
            .then(res => {
                window.location.hash = ''; 
                handleRouting();
            })
            .catch(err => {
                showError(err.message || 'Failed to create thread.');
            });
    };
};


// edit thread
const showEditThreadScreen = (thread) => {
    pageContents.innerText = ''; 

    // navi-bar
    const nav = document.getElementById('nav-container');
    if (nav) {
        nav.innerText = '';
        const backBtn = createElement('button', { id: 'home-button' }, 'Back to Dashboard');
        
        const profileBtn = createElement('button', { 
            id: 'avatar-label', 
            onclick: () => { window.location.hash = '#profile'; } 
        }, 'My Profile');
        
        const logoutBtn = createElement('button', { id: 'logout-button', onclick: logout }, 'Logout');
        
        nav.appendChild(backBtn);
        nav.appendChild(profileBtn);
        nav.appendChild(logoutBtn);

        backBtn.onclick = () => { window.location.hash = ''; };
    }

    // edit page
    const formContainer = createElement('div', { id: 'edit-thread-container', style: 'max-width: 600px; margin: 40px auto; padding: 20px;' });
    const heading = createElement('h2', { style: 'margin-bottom: 20px;' }, 'Edit Thread');

    // title
    const titleInput = createElement('input', { 
        id: 'edit-thread-title', 
        type: 'text', 
        value: thread.title, 
        style: 'width: 100%; margin-bottom: 15px; padding: 10px;' 
    });

    // body
    const bodyInput = createElement('textarea', { 
        id: 'edit-thread-body', 
        rows: '8', 
        style: 'width: 100%; margin-bottom: 15px; padding: 10px;' 
    });
    bodyInput.value = thread.content;

    // private checkbox
    const privateWrapper = createElement('div', { style: 'display: flex; align-items: center; margin-bottom: 10px; width: 100%;' });
    const privateCheckbox = createElement('input', { 
        id: 'edit-thread-private', 
        type: 'checkbox',
        style: 'width: 16px; height: 16px; margin: 0 10px 0 0; cursor: pointer;' 
    });
    privateCheckbox.checked = !thread.isPublic;
    const privateLabel = createElement('label', { htmlFor: 'edit-thread-private', style: 'font-size: 0.95rem; cursor: pointer;' }, 'Make this thread private');
    privateWrapper.appendChild(privateCheckbox);
    privateWrapper.appendChild(privateLabel);

    // locked checkbox
    const lockedWrapper = createElement('div', { style: 'display: flex; align-items: center; margin-bottom: 20px; width: 100%;' });
    const lockedCheckbox = createElement('input', { 
        id: 'edit-thread-locked', 
        type: 'checkbox',
        style: 'width: 16px; height: 16px; margin: 0 10px 0 0; cursor: pointer;' 
    });
    lockedCheckbox.checked = thread.lock || false;
    const lockedLabel = createElement('label', { htmlFor: 'edit-thread-locked', style: 'font-size: 0.95rem; cursor: pointer;' }, 'Lock this thread');
    lockedWrapper.appendChild(lockedCheckbox);
    lockedWrapper.appendChild(lockedLabel);

    // submit-btn
    const submitBtn = createElement('button', { 
        id: 'edit-thread-submit', 
        style: 'padding: 10px 20px; background-color: #ffad1f; color: white; border: none; border-radius: 5px; cursor: pointer;' 
    }, 'Save Changes');

    formContainer.appendChild(heading);
    formContainer.appendChild(titleInput);
    formContainer.appendChild(bodyInput);
    formContainer.appendChild(privateWrapper);
    formContainer.appendChild(lockedWrapper);
    formContainer.appendChild(submitBtn);
    
    pageContents.appendChild(formContainer);

    // submit
    submitBtn.onclick = () => {
        const title = titleInput.value.trim();
        const content = bodyInput.value.trim();
        const isPublic = !privateCheckbox.checked; 
        const isLocked = lockedCheckbox.checked;

        if (!title || !content) {
            showError('Title and content cannot be empty.');
            return;
        }

        const body = { id: thread.id, title, content, isPublic, lock: isLocked };

        // send request
        apiCall('/thread', 'PUT', body)
            .then(() => {
                window.location.hash = '#thread=' + thread.id;
                handleRouting();
            })
            .catch(err => {
                showError(err.message || 'Failed to edit thread.');
            });
    };
};


// comment

// reply comment
const showReplyModal = (threadId, parentCommentId, onSuccess) => {
    // whole reply div
    const overlay = createElement('div', {
        style: 'position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 1000;'
    });

    // main div
    const modal = createElement('div', {
        id: 'comment-reply-container', 
        style: 'background: white; padding: 20px; border-radius: 8px; width: 400px; max-width: 90%; box-shadow: 0 4px 12px rgba(0,0,0,0.15);'
    });

    const title = createElement('h3', { style: 'margin-top: 0;' }, 'Reply to Comment');

    // input box
    const textarea = createElement('textarea', {
        id: 'comment-reply-text', 
        rows: '4',
        style: 'width: 100%; margin-bottom: 15px; padding: 10px;',
        placeholder: 'Type your reply here...'
    });

    const btnContainer = createElement('div', { style: 'display: flex; justify-content: flex-end; gap: 10px;' });
    const cancelBtn = createElement('button', { style: 'padding: 8px 15px; background: #ccc; border: none; border-radius: 4px; cursor: pointer;' }, 'Cancel');
    
    // submit btn
    const submitBtn = createElement('button', {
        id: 'comment-reply-submit', 
        style: 'padding: 8px 15px; background: #1da1f2; color: white; border: none; border-radius: 4px; cursor: pointer;'
    }, 'Comment');

    // close area
    cancelBtn.onclick = () => document.body.removeChild(overlay);

    // post
    submitBtn.onclick = () => {
        const content = textarea.value.trim();
        if (!content) {
            showError('Reply cannot be empty.');
            return;
        }

        const body = {
            threadId: threadId,
            content: content,
            parentCommentId: parentCommentId 
        };

        apiCall('/comment', 'POST', body)
            .then(() => {
                document.body.removeChild(overlay); 
                if (onSuccess) onSuccess();
            })
            .catch(err => showError(err.message));
    };

    btnContainer.appendChild(cancelBtn);
    btnContainer.appendChild(submitBtn);
    modal.appendChild(title);
    modal.appendChild(textarea);
    modal.appendChild(btnContainer);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
};

// like comment
const handleCommentLike = (commentId, turnon, onSuccess) => {
    apiCall('/comment/like', 'PUT', { id: commentId, turnon: turnon })
        .then(() => {
            if (onSuccess) onSuccess(); 
        })
        .catch(err => {
            showError(err.message);
        });
};

// edit comment
const showEditCommentModal = (comment, onSuccess) => {
    // popout div
    const overlay = createElement('div', {
        style: 'position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 1000;'
    });

    // main div
    const modal = createElement('div', {
        id: 'comment-edit-container', 
        style: 'background: white; padding: 20px; border-radius: 8px; width: 400px; max-width: 90%; box-shadow: 0 4px 12px rgba(0,0,0,0.15);'
    });

    const title = createElement('h3', { style: 'margin-top: 0;' }, 'Edit Comment');

    // input textbox
    const textarea = createElement('textarea', {
        id: 'comment-edit-text', 
        rows: '4',
        style: 'width: 100%; margin-bottom: 15px; padding: 10px;'
    });
    
    // put old commoent inside the textbox
    textarea.value = comment.content; 

    const btnContainer = createElement('div', { style: 'display: flex; justify-content: flex-end; gap: 10px;' });
    const cancelBtn = createElement('button', { style: 'padding: 8px 15px; background: #ccc; border: none; border-radius: 4px; cursor: pointer;' }, 'Cancel');
    
    // submit btn
    const submitBtn = createElement('button', {
        id: 'comment-edit-submit', 
        style: 'padding: 8px 15px; background: #ffad1f; color: white; border: none; border-radius: 4px; cursor: pointer;'
    }, 'Save');

    // close div
    cancelBtn.onclick = () => document.body.removeChild(overlay);

    // put
    submitBtn.onclick = () => {
        const updatedContent = textarea.value.trim();
        if (!updatedContent) {
            showError('Comment content cannot be empty.');
            return;
        }

        apiCall('/comment', 'PUT', { id: comment.id, content: updatedContent })
            .then(() => {
                document.body.removeChild(overlay);
                if (onSuccess) onSuccess();
            })
            .catch(err => showError(err.message));
    };

    btnContainer.appendChild(cancelBtn);
    btnContainer.appendChild(submitBtn);
    modal.appendChild(title);
    modal.appendChild(textarea);
    modal.appendChild(btnContainer);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
};

// write and load comment
const renderComment = (comment, allComments, threadId, onSuccess, depth = 0) => {
    // comment div
    const container = createElement('div', { 
        className: 'list-comment-container',
    });

    // comment header
    const header = createElement('div', { style: 'display: flex; align-items: center; gap: 10px; margin-bottom: 5px;' });
    const profileImg = createElement('img', { 
        className: 'list-comment-profile', 
        src: './assets/default-avatar.png', 
        style: 'width: 30px; height: 30px; border-radius: 50%;' 
    });
    apiCall(`/user?userId=${comment.creatorId}`, 'GET') // get user avatar image
        .then(user => {
            if (user.image) {
                profileImg.src = user.image;
            }
        })
        .catch(() => {
            // stay defalt avatarimage
        });
    const authorName = createElement('span', { // link to profile
        className: 'list-comment-author', 
        style: 'font-weight: bold; cursor: pointer; color: #1da1f2;',
        onclick: () => { window.location.hash = '#profile=' + comment.creatorId; }
    }, `User ${comment.creatorId}`);
    const dateText = createElement('span', { className: 'list-comment-date', style: 'font-size: 0.8em; color: #888;' }, formatTime(comment.createdAt));
    
    header.appendChild(profileImg);
    header.appendChild(authorName);
    header.appendChild(dateText);

    // comment body
    const body = createElement('div', { className: 'list-comment-body', style: 'margin-bottom: 10px;' }, comment.content);

    // comment like
    const likesCount = createElement('span', { className: 'list-comment-likes', style: 'font-size: 0.85em; color: #e0245e;' }, `Like ${comment.likes ? comment.likes.length : 0}`);

    // commen btn div
    const actions = createElement('div', { style: 'display: flex; gap: 10px;' });

    // like btn
    const currentUserId = parseInt(localStorage.getItem('currentUserId'), 10);
    const isLiked = comment.likes && comment.likes.includes(currentUserId);
    const likeBtn = createElement('button', { 
        className: 'comment-like-toggle',
        style: `padding: 5px 10px; cursor: pointer; border: 1px solid #e0245e; border-radius: 4px; background-color: ${isLiked ? '#e0245e' : 'white'}; color: ${isLiked ? 'white' : '#e0245e'};`
    }, isLiked ? 'Unlike' : 'Like');
    likeBtn.onclick = () => handleCommentLike(comment.id, !isLiked, onSuccess);

    // reply btn
   const replyBtn = createElement('button', { className: 'comment-reply-button' }, 'Reply');
    replyBtn.onclick = () => showReplyModal(threadId, comment.id, onSuccess);

    actions.appendChild(likesCount);
    actions.appendChild(likeBtn);
    actions.appendChild(replyBtn);

    // edit btn auth only
    const isAdmin = localStorage.getItem('isAdmin') === 'true';
    if (isAdmin || comment.creatorId === currentUserId) {
        const editBtn = createElement('button', { className: 'comment-edit-button' }, 'Edit');
        editBtn.onclick = () => showEditCommentModal(comment, onSuccess);
        actions.appendChild(editBtn);
    }

    container.appendChild(header);
    container.appendChild(body);
    container.appendChild(actions);

    // load comment with reg
    const children = allComments
        .filter(c => c.parentCommentId === comment.id || c.parentId === comment.id)
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)); // old first

    children.forEach(child => {
        container.appendChild(renderComment(child, allComments, threadId, onSuccess, depth + 1));
    });

    return container;
};



// profile page
const showProfile = (userId) => {
    pageContents.innerText = ''; 

    // navi-bar
    const nav = document.getElementById('nav-container');
    if (nav) {
        nav.innerText = '';
        const backBtn = createElement('button', { onclick: () => { window.location.hash = ''; } }, 'Back to Dashboard');
        const profileBtn = createElement('button', { id: 'avatar-label', onclick: () => { window.location.hash = '#profile'; } }, 'My Profile');
        const logoutBtn = createElement('button', { id: 'logout-button', onclick: logout }, 'Logout');
        nav.appendChild(backBtn);
        nav.appendChild(profileBtn);
        nav.appendChild(logoutBtn);
    }
    // main div
    const profileContainer = createElement('div', { id: 'profile-container', style: 'max-width: 800px; margin: 40px auto; padding: 20px;' });
    pageContents.appendChild(profileContainer);

    // get user data
    apiCall(`/user?userId=${userId}`, 'GET')
        .then(user => {
            // show userdata
            const header = createElement('div', { style: 'display: flex; align-items: center; gap: 20px; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 1px solid #eee;' });
            
            // image
            const avatarSrc = user.image ? user.image : './assets/default-avatar.png';
            const avatarImg = createElement('img', { 
                src: avatarSrc, 
                style: 'width: 100px; height: 100px; border-radius: 50%; object-fit: cover; border: 2px solid #1da1f2;' 
            });

            const infoDiv = createElement('div', {});
            const nameEl = createElement('h2', { style: 'margin: 0 0 10px 0;' }, user.name);
            const emailEl = createElement('p', { style: 'margin: 0 0 5px 0; color: #666;' }, `Email: ${user.email}`);
            
            // Admin sign
            const roleText = user.admin ? ' Admin' : ' User';
            const roleEl = createElement('p', { style: 'margin: 0; font-weight: bold; color: #ffad1f;' }, roleText);

            infoDiv.appendChild(nameEl);
            infoDiv.appendChild(emailEl);
            infoDiv.appendChild(roleEl);
            
            header.appendChild(avatarImg);
            header.appendChild(infoDiv);
            profileContainer.appendChild(header);

            // edit profile
            const currentUserId = parseInt(localStorage.getItem('currentUserId'), 10);
            if (user.id === currentUserId) {
                const editProfileBtn = createElement('button', { 
                    style: 'margin-top: 10px; padding: 5px 10px; background: white; border: 1px solid #1da1f2; color: #1da1f2; border-radius: 4px; cursor: pointer;' 
                }, 'Edit Profile');
                
                editProfileBtn.onclick = () => showEditProfileModal(user, () => showProfile(user.id));
                infoDiv.appendChild(editProfileBtn);
            }

            // admin change
            const isCurrentUserAdmin = localStorage.getItem('isAdmin') === 'true';

            // admin in iser profile page
            if (isCurrentUserAdmin && user.id !== currentUserId) {
                const adminSection = createElement('div', { style: 'margin-top: 20px; padding: 15px; background: #fff8e1; border: 1px solid #ffe082; border-radius: 5px;' });
                const adminTitle = createElement('h4', { style: 'margin-top: 0;' }, 'Admin Controls');
                
                const roleSelect = createElement('select', { id: 'user-permission', style: 'padding: 5px; margin-right: 10px; margin-bottom: 10px;' });
                const optUser = createElement('option', { value: 'false' }, 'User');
                const optAdmin = createElement('option', { value: 'true' }, 'Admin');
                
                roleSelect.appendChild(optUser);
                roleSelect.appendChild(optAdmin);
                roleSelect.value = user.admin ? 'true' : 'false';

                const updateRoleBtn = createElement('button', { id: 'user-permission-submit', style: 'padding: 5px 15px; background: #ffad1f; color: white; border: none; border-radius: 4px; cursor: pointer;' }, 'Update Role');

                updateRoleBtn.onclick = () => {
                    const makeAdmin = roleSelect.value === 'true';
                    apiCall('/user/admin', 'PUT', { userId: user.id, turnon: makeAdmin })
                        .then(() => showProfile(user.id))
                        .catch(err => showError("Failed to update role: " + err.message));
                };

                adminSection.appendChild(adminTitle);
                adminSection.appendChild(roleSelect);
                adminSection.appendChild(updateRoleBtn);
                
                profileContainer.appendChild(adminSection); 
            }

            // user post list
            const threadsSection = createElement('div', { style: 'margin-top: 30px;' });
            const threadsTitle = createElement('h3', {}, `${user.name}'s Threads`);
            const threadsList = createElement('div', { id: 'profile-thread-list' });
            
            threadsSection.appendChild(threadsTitle);
            threadsSection.appendChild(threadsList);
            profileContainer.appendChild(threadsSection);


            // get user list
            apiCall('/threads?start=0', 'GET')
                .then(ids => {
                    const detailPromises = ids.map(id => apiCall(`/thread?id=${id}`, 'GET').then(t => { t.id = id; return t; }));
                    return Promise.all(detailPromises);
                })
                .then(threads => {
                    const userThreads = threads.filter(t => t.creatorId === user.id);
                    
                    if (userThreads.length === 0) {
                        threadsList.appendChild(createElement('p', { style: 'color: #888;' }, 'This user has not posted any threads yet.'));
                        return;
                    }

                    userThreads.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

                    userThreads.forEach(thread => {
                        apiCall(`/comments?threadId=${thread.id}`, 'GET')
                            .then(comments => {
                                const threadCard = createElement('div', { 
                                    className: 'profile-thread-container', 
                                    style: 'border: 1px solid #e1e8ed; padding: 15px; margin-bottom: 10px; border-radius: 8px; cursor: pointer;' 
                                });
                                
                                const tTitle = createElement('h4', { className: 'profile-thread-title', style: 'margin-top: 0; margin-bottom: 5px; color: #1da1f2;' }, thread.title);
                                const tContent = createElement('p', { className: 'profile-thread-content', style: 'margin: 0 0 10px 0; color: #333;' }, thread.content);
                                
                                const statsDiv = createElement('div', { style: 'display: flex; gap: 15px; font-size: 0.85em;' });
                                const tLikes = createElement('span', { className: 'profile-thread-likes', style: 'color: #e0245e;' }, `Likes: ${thread.likes ? thread.likes.length : 0}`);
                                const tComments = createElement('span', { className: 'profile-thread-comments', style: 'color: #17bf63;' }, `Comments: ${comments.length}`);
                                
                                statsDiv.appendChild(tLikes);
                                statsDiv.appendChild(tComments);
                                
                                threadCard.appendChild(tTitle);
                                threadCard.appendChild(tContent);
                                threadCard.appendChild(statsDiv);
                                
                                threadCard.onclick = () => { window.location.hash = '#thread=' + thread.id; };
                                
                                threadsList.appendChild(threadCard);
                            })
                            .catch(err => console.error("Failed to load comments", err));
                    });
                })
                .catch(err => showError("Failed to load user threads: " + err.message));

        })
        .catch(err => showError("Failed to load profile: " + err.message));
};

// edit profile page
const showEditProfileModal = (user, onSuccess) => {
    const overlay = createElement('div', {
        style: 'position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 1000;'
    });

    const modal = createElement('div', {
        style: 'background: white; padding: 20px; border-radius: 8px; width: 400px; max-width: 90%; box-shadow: 0 4px 12px rgba(0,0,0,0.15);'
    });

    const title = createElement('h3', { style: 'margin-top: 0;' }, 'Edit Profile');

    // put old name and email in box
    const nameInput = createElement('input', { type: 'text', value: user.name, placeholder: 'Full Name', style: 'width: 100%; margin-bottom: 10px; padding: 8px;' });
    const emailInput = createElement('input', { type: 'email', value: user.email, placeholder: 'Email', style: 'width: 100%; margin-bottom: 10px; padding: 8px;' });
    
    // password
    const passwordInput = createElement('input', { type: 'password', placeholder: 'New Password (leave blank to keep current)', style: 'width: 100%; margin-bottom: 15px; padding: 8px;' });

    // local image upload
    const imageLabel = createElement('p', { style: 'margin: 0 0 5px 0; font-size: 0.9em; color: #555;' }, 'Upload new avatar (optional):');
    const imageInput = createElement('input', { type: 'file', accept: 'image/jpeg, image/png, image/jpg', style: 'margin-bottom: 20px; width: 100%;' });

    const btnContainer = createElement('div', { style: 'display: flex; justify-content: flex-end; gap: 10px;' });
    const cancelBtn = createElement('button', { style: 'padding: 8px 15px; background: #ccc; border: none; border-radius: 4px; cursor: pointer;' }, 'Cancel');
    const submitBtn = createElement('button', { style: 'padding: 8px 15px; background: #1da1f2; color: white; border: none; border-radius: 4px; cursor: pointer;' }, 'Save');

    cancelBtn.onclick = () => document.body.removeChild(overlay);

    submitBtn.onclick = () => {
        const email = emailInput.value.trim();
        const name = nameInput.value.trim();
        const password = passwordInput.value;

        if (!email || !name) {
            showError('Email and Name cannot be empty.');
            return;
        }

        // put
        const body = {};   
        if (email !== user.email) body.email = email;
        if (name !== user.name) body.name = name;
        if (password) body.password = password;

        const sendUpdate = (finalBody) => {
            // if nothing change, return
            if (Object.keys(finalBody).length === 0) {
                document.body.removeChild(overlay);
                return;
            }

            apiCall('/user', 'PUT', finalBody)
                .then(() => {
                    document.body.removeChild(overlay);
                    if (onSuccess) onSuccess(); 
                })
                .catch(err => showError("Update failed: " + err.message));
        };

        // file to dataurl
        if (imageInput.files.length > 0) {
            const file = imageInput.files[0];
            fileToDataUrl(file)
                .then(dataUrl => {
                    body.image = dataUrl; 
                    sendUpdate(body);
                })
                .catch(err => showError('Failed to process image: ' + err.message));
        } else {
            if (user.image) body.image = user.image;
            sendUpdate(body);
        }
    };

    btnContainer.appendChild(cancelBtn);
    btnContainer.appendChild(submitBtn);
    
    modal.appendChild(title);
    modal.appendChild(nameInput);
    modal.appendChild(emailInput);
    modal.appendChild(passwordInput);
    modal.appendChild(imageLabel);
    modal.appendChild(imageInput);
    modal.appendChild(btnContainer);
    
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
};

// page entrance, with hash Routing
const handleRouting = () => {
    if (currentPollingInterval) { // kill old timer when url change
        clearInterval(currentPollingInterval);
        currentPollingInterval = null;
    }
    const hash = window.location.hash;
    const token = localStorage.getItem('token');

    // check token
    if (!token) {
        showLogin();
        return;
    }

    // use hash for direct
    if (hash.startsWith('#thread=')) {
        const threadId = parseInt(hash.split('=')[1], 10);
        showDashboard(threadId); 
    } else if (hash.startsWith('#profile=')) {
        const userId = parseInt(hash.split('=')[1], 10);
        showProfile(userId);
    } else if (hash === '#profile') {
        showProfile(localStorage.getItem('currentUserId'));
    } else if (hash === '#create') { // create page
        showCreateThreadScreen();
    } else if (hash.startsWith('#edit=')) { // edit page
        const threadId = parseInt(hash.split('=')[1], 10);      
        apiCall(`/thread?id=${threadId}`, 'GET')
            .then(threadInfo => {
                threadInfo.id = threadId; 
                showEditThreadScreen(threadInfo);
            })
            .catch(err => {
                showError("Failed to load thread for editing: " + err.message);
                window.location.hash = ''; 
                handleRouting();
            });
    } else {
        showDashboard();
    }
};

// check #
window.addEventListener('hashchange', handleRouting);

handleRouting();

