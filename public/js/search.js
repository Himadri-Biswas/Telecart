const searchKey = decodeURI(location.pathname.split('/').pop())
const searchSpanElement = document.querySelector('#search-key')
searchSpanElement.innerHTML = searchKey

getProducts(searchKey).then(data => createProductCards(data, '.card-container'))

// New function for searching by product name
const searchByName = (productName) => {
    fetch(`/search/name/${productName}`)
        .then(res => res.json())
        .then(data => {
            createProductCards(data, '.card-container');
        });
}

// Call this function when searching by product name
searchByName(searchKey);