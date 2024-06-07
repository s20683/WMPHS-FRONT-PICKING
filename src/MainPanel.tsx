import {Grid, MenuItem, Select} from '@mui/material';
import React, {useEffect, useState} from 'react';
import PickingPanel from "./PickingPanel";
import axios from "axios";

export interface User{
    id: number;
    name: string;
}
const MainPanel = () => {
    const [selectedUser, setSelectedUser] = useState<number>(-1)
    const [users, setUsers] = useState<User[]>([])

    function loadUsers(){
        axios.get("/gui2wmphs/getUsers")
            .then(response =>{
                console.log(response)
                if (response?.data)
                    setUsers(response.data)
            })
            .catch(error => console.error('Error fetching users:', error));
    }
    useEffect(() => {
        loadUsers()
        const intervalId = setInterval(loadUsers, 2000);
        return () => clearInterval(intervalId);
    }, []);


    return (
        <Grid container sx={{
            height: "75vh",
            width: "75%",
            backgroundColor:"#E8E8E8",
            padding: "10px",
            borderRadius: 5,
            display: "flex",
            justifyContent: "center",
        }}
        >
            {(selectedUser === -1) ?
                <Grid
                    container
                    sx={{
                        width:"50%",
                        fontSize: "50px",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        height: "60vh",
                        textAlign: "center",
                        flexDirection: "column"
                    }}
                >
                    Wybierz użytkownika
                    <Grid container>
                        <Select
                            labelId="demo-simple-select-label"
                            id="demo-simple-select"
                            value={selectedUser}
                            sx={{ width: "100%" }}
                            label="Wybierz użytkownika"
                            onChange={(event) => {
                                setSelectedUser(Number(event.target.value));
                            }}
                        >
                            {users.map((user, index) => {
                                return (
                                    <MenuItem key={user.id} value={user.id}>{user.name}</MenuItem>
                                );
                            })}
                        </Select>
                    </Grid>
                </Grid> :
                <PickingPanel setSelectedUser={setSelectedUser} selectedUser={selectedUser} users={users}/>
            }
        </Grid>
        );
};

export default MainPanel;
