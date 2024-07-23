let headersList = {
 "Accept": "*/*",
 "User-Agent": "Thunder Client (https://www.thunderclient.com)",
 "Authorization": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6IjMxODcwY3NAZ21haWwuY29tIiwiaWQiOiI2NjU0ODZkNDQwMjZhNTcwOWY4OWRmM2YiLCJpYXQiOjE3MTY4MTYwMjIsImV4cCI6MTcxNjkwMjQyMn0.eG8uB1uD1ofUtDW0t-3tD3XHky8v8i0XBAQh94eqGs0",
 "Content-Type": "application/json"
}

let bodyContent = new FormData();
bodyContent.append("username", "test");
bodyContent.append("fullName", "test");
bodyContent.append("email", "test@test");
bodyContent.append("password", "1234");
bodyContent.append("avatar", "c:\Users\kusha\OneDrive\Pictures\Screenshots\Screenshot 2024-07-19 114318.png");
bodyContent.append("coverImage", "c:\Users\kusha\OneDrive\Pictures\Screenshots\Screenshot 2024-07-21 211054.png");

let response = await fetch("http://localhost:3000/api/v1/users/register", { 
  method: "POST",
  body: bodyContent,
  headers: headersList
});

let data = await response.text();
console.log(data);
