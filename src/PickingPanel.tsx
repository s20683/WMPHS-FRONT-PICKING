import React, {useEffect, useState} from 'react';
import {Grid} from "@mui/material";
import {User} from "./MainPanel";
import ContainedButton from "./components/ContainedButton";
import {MdOutlinePanoramaWideAngleSelect} from "react-icons/md";
import axios from "axios";
import Swal, { SweetAlertResult } from 'sweetalert2';

interface Props {
    selectedUser: number;
    setSelectedUser: (id: number) => void;
    users: User[];
}
export interface Order {
    id: number;
    carrierVolume: number;
    state: number;
    destinationId: number;
    destinationName: string;
    userId: number;
    userName: string;
}
interface Carrier {
    id: number;
    barcode: string;
    volume: number;
    orderId: number;
    toComplete: number;
    isProceeding: boolean;
}
export interface Line{
    id: number;
    quantity: number;
    quantityCompleted:number;
    productId: number;
    productName: string;
    productLocation: string;
    carrierId: number;
}
const PickingPanel = ({selectedUser, users, setSelectedUser} : Props) => {
    const selectedUserInfo = users.find((user) => user.id === selectedUser);
    const [receivedOrder, setReceivedOrder] = useState<Order | null>(null);
    const [carriers, setCarriers] = useState<Carrier[]>([])
    const [msg, setMsg] = useState<string>('')
    const [processMessage, setProcessMessage] = useState<string>('POBIERZ ZLECENIE')
    const [lines, setLines] = useState<Line[]>([])
    function getReleasedOrder() {
        if (!selectedUserInfo) {
            setMsg("Brak użytkownika")
            return;
        }
        axios.get(`/picking2wmphs/getReleasedOrder/${selectedUserInfo.id}`)
            .then(response =>{
                console.log(response)
                if (response?.data) {
                    setReceivedOrder(response.data)
                    setProcessMessage("PRZYPISZ KODY POJEMNIKÓW")
                    loadCarriers(response.data.id)
                }
                else
                    setMsg("Brak zleceń dla użytkownika " + selectedUserInfo.name)
            })
            .catch(error => console.error('Error fetching releasedOrder:', error));
    }
    function areAllBarcodesPresent(carriersToCheck: Carrier[]) {
        return carriersToCheck.every(carrier => carrier.barcode !== "");
    }
    function loadCarriers(id : number){
        axios.get(`/picking2wmphs/getCarriersToCompletation/${id}`)
            .then(response =>{
                console.log(response)
                if (response?.data) {
                    setCarriers(response.data)
                    if (areAllBarcodesPresent(response.data)){
                        setProcessMessage("Rozpocznij kompletację")
                    }
                }
            })
            .catch(error => console.error('Error fetching carriers:', error));
    }

    function getLineData() {
        if (areAllBarcodesPresent(carriers)) {
            const carriersId = carriers.map(carrier => carrier.id);
            axios.post<Line[]>(`/picking2wmphs/getLineForCarriers`, {carriersId})
                .then(response =>{
                    console.log(response)
                    if (response?.data) {
                        setLines(response.data)
                        if (response.data.length === 0 && receivedOrder) {
                            setProcessMessage("Kompletacja zakończona, zdejmij pojemniki i pobierz nowe zlecenie")
                            setReceivedOrder(null)
                            setCarriers([])
                            setLines([])
                        } else {
                            const productName = response.data[0].productName;
                            const productLocation = response.data[0].productLocation;
                            setProcessMessage("Przełóż produkt " + productName + " z lokacji " + productLocation)
                            const updatedCarriers = carriers.map(carrier => {
                                const line = response.data.find(line => line.carrierId === carrier.id);
                                if (line) {
                                    return { ...carrier, toComplete: line.quantity - line.quantityCompleted };
                                }
                                return { ...carrier, toComplete: 0 };
                            });
                            setCarriers(updatedCarriers);
                        }
                    }
                })
                .catch(error => console.error('Error fetching carriers:', error));
        }
    }

    function setCarrierBarcode(id: number) {
        Swal.fire({
            title: 'Potwierdzenie',
            text: 'Podaj kod pojemnika',
            icon: 'warning',
            input: 'text',
            inputAttributes: {
                minlength: '3',
                maxlength: '20',
                autocapitalize: 'off',
                autocorrect: 'off'
            },
            showCancelButton: true,
            confirmButtonText: 'Tak',
            cancelButtonText: 'Nie',
            inputValidator: (value: string) => {
                if (!value) {
                    return 'Musisz wpisać kod!';
                } else if (value.length < 3 || value.length > 20) {
                    return 'Kod musi mieć co najmniej 3 znaki i maksymalnie 20 znaków';
                }
                return null;
            }
        }).then((result: SweetAlertResult) => {
            if (result.isConfirmed) {
                const barcode = result.value as string;
                axios.post(`/picking2wmphs/setCarrierBarcode/${id}/${barcode}`)
                    .then(response => {
                        console.log(response.data);
                        if (receivedOrder) {
                            loadCarriers(receivedOrder.id);
                        }
                    })
                    .catch(error => {
                        console.error(error);
                    });
            }
        });
    }
    function handleProceeder(){
        if (!receivedOrder) {
            getReleasedOrder()
        }
        if (areAllBarcodesPresent(carriers)) {
            getLineData()
        }
    }
    const resetIsProceeding = () => {
        const newCarriers = carriers.map(carrier => ({
            ...carrier,
            isProceeding: false
        }));
        setCarriers(newCarriers);
    };
    const setIsProceeding = () => {
        const newCarriers = carriers.map(carrier => ({
            ...carrier,
            isProceeding: true
        }));
        setCarriers(newCarriers);
    };
    function completeLine(line: Line, completedQuantity: number) {
        // line.quantityCompleted = completedQuantity
        axios.post(`/picking2wmphs/completeLine`, {line: line, orderId: (receivedOrder) ? receivedOrder.id : -1})
            .then(response => {
                resetIsProceeding()
                console.log(response.data);
                if (!response.data.success) {
                    setMsg(response.data.errorMessage)
                } else {
                    getLineData()
                }
            })
            .catch(error => {
                resetIsProceeding()
                console.error(error);
            });
    }
    return (
        <>
            <Grid container>
                <Grid item xs={1} sx={{ height: "40px", fontSize: "15px",color: "white", margin:"7px", backgroundColor: "#2d2d2d", borderRadius: 5}}>
                    <ContainedButton
                        sx={{
                            fontSize: "12px",
                            borderRadius: 5,
                            color: "white",
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            height: "100%",
                            width: "100%"
                        }}
                        label={'Wyloguj'}
                        onClick={() => {
                            setSelectedUser(-1)
                        }}
                    />
                </Grid>

                <Grid item xs={3} sx={{ height: "40px", fontSize: "15px",color: "white", margin:"7px", backgroundColor: "#2d2d2d", padding:"10px", borderRadius: 5}}>
                    <Grid container>
                        <Grid item xs={6}>
                            Użytkownik: {selectedUserInfo && selectedUserInfo.name}
                        </Grid>
                        <Grid item xs={4}>
                            Zlecenie: {receivedOrder && receivedOrder.id}
                        </Grid>
                    </Grid>
                </Grid>
                <Grid item xs={4} sx={{ height: "40px", fontSize: "15px",color: "#2d2d2d",fontWeight:"bold", margin:"7px", padding:"10px"}}>
                    Rezultat:{msg}
                </Grid>
                <Grid item xs={2} sx={{ marginLeft: "auto" }}>
                    <ContainedButton sx={{ width: "90%",height: "40px", fontSize: "15px",color: "white", margin:"7px", backgroundColor: "#2d2d2d", padding:"10px", borderRadius: 5}}
                                     label=""
                                     icon={<MdOutlinePanoramaWideAngleSelect />}
                                     onClick={()=>{
                                         handleProceeder()
                                     }}/>

                </Grid>
            </Grid>
            <Grid
                sx={{
                    whiteSpace: "normal",
                    overflowWrap: "break-word",
                    wordBreak: "break-word",
                    fontSize: "45px",
                    color: "white",
                    backgroundColor: "#2d2d2d",
                    height: "30%",
                    borderRadius: 5,
                    margin: "7px",
                    padding: "20px",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    textAlign: "center",
                    flexDirection: "column",
                    width: "100%"
                }}
                container
            >
                {processMessage}
            </Grid>
            <Grid sx={{backgroundColor:"#2d2d2d", height: "42%", borderRadius: 5, margin: "7px", padding: "5px"}} container>
                <Grid container sx={{height: "50%"}}>
                    {carriers && (
                        carriers.sort((a, b) => a.id - b.id).slice(0, 3).map((carrier, index) => {
                            return (
                            <Grid key={carrier.id} item xs={4} container sx={{ height: "100%"}}>
                                <Grid container sx={{ backgroundColor: "white", borderRadius: 5, margin: "5px"}}>
                                    <Grid container sx={{ backgroundColor: "#2d2d2d", borderRadius: 5, margin: "2px", height: "35%"}}>

                                        <ContainedButton sx={{width: "100%", fontSize:"15px",borderRadius: 5, marginRight: "0px", color: "white"}}
                                                         label={carrier.barcode}
                                                         onClick={()=>{
                                                             setCarrierBarcode(carrier.id)
                                                         }}
                                        />
                                    </Grid>
                                    <Grid container sx={{ display: "flex", justifyContent: "center", alignItems: "center", width: "100%", height: "45%" }}>
                                        <Grid container sx={{ display: "flex", justifyContent: "center", alignItems: "center", width: "50%", backgroundColor: "#2d2d2d", borderRadius: 5, margin: "2px", height: "100%",
                                            color:"white", fontSize:"25px", textAlign:"center"}}>
                                            <ContainedButton sx={{width: "100%",height:"100%", fontSize: "25px", borderRadius: 5, marginRight: "0px", color: "white"}}
                                                             label={carrier.toComplete ? String(carrier.toComplete) : ''}
                                                             disabled={!carrier.toComplete || carrier.isProceeding}
                                                             onClick={()=>{
                                                                 const line = lines.find(line => line.carrierId === carrier.id);
                                                                 if (line) {
                                                                     completeLine(line, carrier.toComplete);
                                                                     setIsProceeding()
                                                                 }
                                                             }}
                                            />
                                        </Grid>
                                    </Grid>
                                </Grid>
                            </Grid>
                            )
                        })
                        )}
                </Grid>
                <Grid container sx={{height: "50%"}}>
                    {carriers && (
                        carriers.sort((a, b) => a.id - b.id).slice(3, 6).map((carrier, index) => {
                            return (
                                <Grid key={carrier.id} item xs={4} container sx={{ height: "100%"}}>
                                    <Grid container sx={{ backgroundColor: "white", borderRadius: 5, margin: "5px"}}>
                                        <Grid container sx={{ backgroundColor: "#2d2d2d", borderRadius: 5, margin: "2px", height: "35%"}}>
                                            <ContainedButton sx={{width: "100%", fontSize: "15px", borderRadius: 5, marginRight: "0px", color: "white"}}
                                                             label={carrier.barcode}
                                                             onClick={()=>{
                                                                 setCarrierBarcode(carrier.id)
                                                             }}
                                            />
                                        </Grid>
                                        <Grid container sx={{ display: "flex", justifyContent: "center", alignItems: "center", width: "100%", height: "45%" }}>
                                            <Grid container sx={{ display: "flex", justifyContent: "center", alignItems: "center", width: "50%", backgroundColor: "#2d2d2d", borderRadius: 5, margin: "2px", height: "100%",
                                                color:"white", fontSize:"25px", textAlign:"center"}}>
                                                <ContainedButton sx={{width: "100%", height:"100%", fontSize: "25px", borderRadius: 5, marginRight: "0px", color: "white"}}
                                                                 label={carrier.toComplete ? String(carrier.toComplete) : ''}
                                                                 disabled={!carrier.toComplete || carrier.isProceeding}
                                                                 onClick={()=>{
                                                                     const line = lines.find(line => line.carrierId === carrier.id);
                                                                     if (line) {
                                                                         completeLine(line, carrier.toComplete);
                                                                         setIsProceeding()
                                                                     }
                                                                 }}
                                                />
                                            </Grid>
                                        </Grid>
                                    </Grid>
                                </Grid>
                            )
                        })
                    )}
                </Grid>
            </Grid>
        </>

    );
};

export default PickingPanel;
