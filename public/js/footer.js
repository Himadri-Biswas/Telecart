const createFooter = () => {
    let footer = document.querySelector('footer')
    footer.innerHTML = `
    <div class="container">
        <div class="d-flex">
            <div class="flex-item">
                <h5 class="mb-5">About Us</h5>
                <p>Head Office: 4/5 Dhanmondi, Dhaka-1200</p>
                <p>Hotline: +8801234567891</p>
                <p>Email: telecart@gmail.com</p>
            </div>
            <div class="flex-item copyright">
                <p>Copyright &copy; 2024. All rights reserved.</p>
            </div>
        </div>
    </div>`
}

createFooter()