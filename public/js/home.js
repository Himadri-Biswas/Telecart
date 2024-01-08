// Fetch users when the page loads
const fetchAndDisplayUsers = async () => {
    try {
        const response = await fetch('/users');
        const users = await response.json();

        // Display the list of users on the page
        const userListContainer = document.querySelector('#user-list');
        if (users.length === 0) {
            userListContainer.innerHTML = 'No users available.';
        } else {
            users.forEach(user => {
                const userItem = document.createElement('div');
                userItem.innerHTML = `
                    <p>Name: ${user[0]}</p>
                    <p>Email: ${user[1]}</p>
                    <p>Password: ${user[2]}</p>
                    <p>Phone Number: ${user[3]}</p>
                    <p>Is Seller: ${user[4]}</p>
                    <hr>
                `;
                userListContainer.appendChild(userItem);
            });
        }
    } catch (error) {
        console.error('Error fetching users:', error.message);
    }
};



fetchAndDisplayUsers();