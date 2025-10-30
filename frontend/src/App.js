import React from "react";
import AddUser from "./components/AddUser";
import UserList from "./components/UserList";
import "./App.css";

function App() {
  return (
    <div className="container">
      <h1>Quản lý người dùng</h1>
      <AddUser />
      <hr />
      <UserList />
    </div>
  );
}

export default App;
