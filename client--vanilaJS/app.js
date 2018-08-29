const CreateAwb = document.querySelector('.CreateAwb');
CreateAwb.addEventListener('submit', (e) => {
    e.preventDefault();
    const awbnr = CreateAwb.querySelector('.awbnr').value;
    post('/api/awb', { awbnr })
});
function post (path, data) {
    return window.fetch(path, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
}
