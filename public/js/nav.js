const createNav = () => {
    let nav = document.querySelector('.nav-container')

    nav.innerHTML = `
    <nav class="navbar navbar-expand-lg navbar-dark bg-dark sticky-top">
    <div class="container-fluid">
        <a class="navbar-brand" href="/">
            <img src="../img/cover5.png" />
        </a>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse"
            data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false"
            aria-label="Toggle navigation">
            <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="navbarSupportedContent">
            <ul class="navbar-nav me-auto mb-2 mb-lg-0 options">
                
                <li class="nav-item">
                    <a class="nav-link">
                        <div id="user-img">
                            Profile 
                            <i class="fas fa-user"></i>
                        </div>
                        <div class="login-logout-popup hide">
                            <p class="account-info">Log in as, name</p>
                            <button class="btn btn-outline-success" id="user-btn">Log out</button>
                        </div>
                    </a>
                </li>
            </ul>
        </div>
    </div>
</nav>

    `
}

createNav();

//nav popup

const userImageButton = document.querySelector('#user-img')
const userPop = document.querySelector('.login-logout-popup')
const popuptext = document.querySelector('.account-info')
const actionBtn = document.querySelector('#user-btn')

userImageButton.addEventListener('click', () => {
    userPop.classList.toggle('hide')
})

window.onload = () => {
    let user = JSON.parse(sessionStorage.user || null)
    if (user != null) {
        //means user is logged in
        popuptext.innerHTML = `Log in as, ${user.name}`
        actionBtn.innerHTML = 'Log out'
        actionBtn.addEventListener('click', () => {
            sessionStorage.clear()
            location.reload()
        })
    } else {
        popuptext.innerHTML = 'Log in '
        actionBtn.innerHTML = 'Log in'
        actionBtn.addEventListener('click', () => {
            location.href = '/login'
        })
    }
}
