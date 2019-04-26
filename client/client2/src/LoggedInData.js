import React, { Component } from 'react';

class LoggedInData extends Component{
    constructor(props) {
        super(props);
        this.state={
            loggedIn: false,
            message: "",
        };
        console.log(this.props.logInfo);
    }

    // This function is submitted when a user wants to add a _todo (ignore the underscore) item to the user's entry in the database
    ToDoItemSubmit=(e)=>{
        // Prevents the default reloading of a page by a form
        e.preventDefault();

        // Send a POST to '/users/addToDo' to the server with username and _todo item in the body
        fetch('/users/addToDo',{
            method: 'POST',
            // Accept tells the server what kind of data the client is expecting.
            // Content-Type tells the server which kind of data the client is sending in the body
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json"
            },
            // Creates a collection for username and todoItem. Because a request can't send a collection, you have to make it a JSON string first
            // e.target is the information being sent from the form input fields by their names give in the input attributes. The value is what was typed.
            body: JSON.stringify({
                username: this.props.logInfo.username,
                todoItem: e.target.todoItem.value,
            }),
        })
        // data on the left side is the raw response data the server sent (res.send)
        // On the right side, use that data parameter with the .text function to change data to normal text.
            .then(data=>data.text())
            // response on the left side is the readable text data.
            // on the right side we're saving the readable text data that's saved in response into the message state.
            .then(response=>this.setState({message: response}));
    };

    render(){
        // If the user is NOT loggedIn, render the below message. loggedIn was sent to this component by BlogHome component
        if(!this.props.logInfo.loggedIn){
            return(<div>
                <h1>NOT LOGGED IN!!!</h1>
            </div>);
        }
        // if the user IS logged in. Show the form to allow them to create a new todoItem
        else {
            return (
                <div>
                    <h1>Welcome {this.props.logInfo.username}</h1>
                    {/*Form for entering a new todoItem. Once you submit the form it runs ToDoItemSubmit*/}
                    <form onSubmit={this.ToDoItemSubmit}>
                        <p>
                            <label htmlFor={"todoItem"}>Enter an additional to do item:</label>
                            <input type="text" id={"todoItem"} name={"todoItem"}/>
                        </p>
                        <button>Submit</button>
                    </form>
                    {/*The display message received from the server in fetch*/}
                    {this.state.message}
                </div>
            );
        }
    }
}

export default LoggedInData;
