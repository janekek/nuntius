export default function () {

    function logout() {
        fetch("http://localhost:5000/api/logout", {
            method: "POST",
            credentials: "include",
            })
        .then(res => res.json())
        .then(data => {
            console.log(data)
        })
        .catch(error => console.error(error))
    }

    

    return(
        <div>
            <h1>Here you can logout</h1>
            <button onClick={logout}>Logout here</button>
        </div>
    );

}