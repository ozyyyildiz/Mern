import React, { useState, useContext } from "react";

import Card from '../../shared/components/UIElements/Card';
import Button from '../../shared/components/FormElements/Button';
import Modal from '../../shared/components/UIElements/Modal';
import ErrorModal from "../../shared/components/UIElements/ErrorModal";
import LoadingSpinner from "../../shared/components/UIElements/LoadingSpinner";
import { AuthContext } from "../../shared/context/auth-context";
import { useHttpClient } from "../../shared/hooks/http-hook";
import './PlaceItem.css';

function PlaceItem(props) {
    const { isLoading, error, sendRequest, clearError } = useHttpClient();
    const auth = useContext(AuthContext);

    const [showMap, setShowMap] = useState(false);

    const [showConfirm, setShowConfirm] = useState(false);

    const openMapHandler = () => setShowMap(true);

    const closeMapHandler = () => setShowMap(false);

    const showDeleteWarningHandler = () => {
        setShowConfirm(true);
    }

    const cancelDeleteHandler = () => {
        setShowConfirm(false);
    }
    const confirmDeleteHandler = async () => {
        setShowConfirm(false);
        try {
            await sendRequest(`http://localhost:5000/api/places/${props.id}`, 'DELETE', null, { Authorization: 'Bearer ' + auth.token });
            props.onDelete(props.id);
        } catch (err) { }
    }

    return (
        <React.Fragment>
            <ErrorModal error={error} onClear={clearError} />
            <Modal
                show={showMap}
                onCancel={closeMapHandler}
                header={props.address}
                contentClass="place-item__modal-content"
                footerClass="place-item__modal-actions"
                footer={<Button onClick={closeMapHandler}>CLOSE</Button>}
            >
                <div className="map-container">
                    <h2>THE MAP!</h2>
                </div>
            </Modal>
            <Modal show={showConfirm} onCancel={cancelDeleteHandler} header="Are you Sure?" footerClass="place-item__modal-actions" footer={
                <React.Fragment>
                    <Button inverse onClick={cancelDeleteHandler}>CANCEL</Button>
                    <Button danger onClick={confirmDeleteHandler}>DELETE</Button>
                </React.Fragment>
            }>
                <p>Deleting process. Are you sure?</p>
            </Modal>
            <li className="place-item">
                <Card className="place-item__content">
                    {isLoading && <LoadingSpinner asOverlay />}
                    <div className="place-item__image">
                        <img src={`http://localhost:5000/${props.image}`} alt={props.title} />
                    </div>
                    <div className="place-item__info">
                        <h2>{props.title}</h2>
                        <h3>{props.address}</h3>
                        <p>{props.description}</p>
                    </div>
                    <div className="place-item__actions">
                        <Button inverse onClick={openMapHandler}>VIEW ON MAP</Button>
                        {auth.userId === props.creatorId && <Button to={`/places/${props.id}`}>EDIT</Button>}
                        {auth.userId === props.creatorId && <Button danger onClick={showDeleteWarningHandler}>DELETE</Button>}
                    </div>
                </Card>
            </li>
        </React.Fragment>
    )
}
export default PlaceItem;