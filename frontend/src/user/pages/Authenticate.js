import React, { useState, useContext } from "react";

import Input from '../../shared/components/FormElements/Input';
import Button from '../../shared/components/FormElements/Button';
import Card from '../../shared/components/UIElements/Card';
import ErrorModal from '../../shared/components/UIElements/ErrorModal';
import LoadingSpinner from '../../shared/components/UIElements/LoadingSpinner';
import ImageUpload from "../../shared/components/FormElements/ImageUpload";
import { VALIDATOR_EMAIL, VALIDATOR_MINLENGTH, VALIDATOR_REQUIRE } from '../../shared/utilities/validators';
import { useForm } from '../../shared/hooks/form-hook';
import { useHttpClient } from "../../shared/hooks/http-hook";
import { AuthContext } from "../../shared/context/auth-context";
import './Auth.css'


function Authenticate() {
    const auth = useContext(AuthContext);

    const [isLoginMode, setIsLoginMode] = useState(true);
    const { isLoading, error, sendRequest, clearError } = useHttpClient();


    const [formState, inputHandler, setFormData] = useForm({
        email: {
            value: '',
            isValid: false
        },
        password: {
            value: '',
            isValid: false
        }
    }, false);

    const switchModeHandler = () => {
        if (!isLoginMode) {
            setFormData({
                ...formState.inputs,
                name: undefined,
                image: undefined
            },
                formState.inputs.email.isValid && formState.inputs.password.isValid)
        } else {
            setFormData({
                ...formState.inputs,
                name: {
                    value: '',
                    isValid: false
                },
                image: {
                    value: null,
                    isValid: false
                }
            }, false)
        }
        setIsLoginMode(prevMode => !prevMode);
    }

    const authSubmitHandler = async e => {
        e.preventDefault();
        console.log(formState.inputs);
        if (isLoginMode) {
            try {
                const responseData = await sendRequest(
                    'http://localhost:5000/api/users/login',
                    'POST',
                    JSON.stringify({
                        email: formState.inputs.email.value,
                        password: formState.inputs.password.value
                    }),
                    {
                        'Content-Type': 'application/json'
                    },
                );
                auth.login(responseData.userId, responseData.token);
            } catch (err) { }
        } else {
            try {
                const formData = new FormData();
                formData.append('email', formState.inputs.email.value);
                formData.append('name', formState.inputs.name.value);
                formData.append('password', formState.inputs.password.value);
                formData.append('image', formState.inputs.image.value);
                const responseData = await sendRequest('http://localhost:5000/api/users/signup', 'POST', formData);
                auth.login(responseData.userId, responseData.token);
            } catch (err) { }
        }
    }
    return (
        <React.Fragment>
            <ErrorModal error={error} onClear={clearError} />
            <Card className="authentication">
                {isLoading && <LoadingSpinner asOverlay />}
                <h2>Login Required</h2>
                <hr />
                <form className="" onSubmit={authSubmitHandler}>
                    {!isLoginMode && <Input id="name" element="input" type="text" label="Name" validators={[VALIDATOR_REQUIRE()]} errorText="Please enter a valid Name." onInput={inputHandler} />}
                    {!isLoginMode && <ImageUpload center id="image" onInput={inputHandler} />}
                    <Input id="email" element="input" type="text" label="E-Mail" validators={[VALIDATOR_EMAIL()]} errorText="Please enter a valid E-mail." onInput={inputHandler} />
                    <Input id="password" element="input" type="password" label="Password" validators={[VALIDATOR_MINLENGTH(6)]} errorText="Please enter a valid password(At Least 5 Characters)." onInput={inputHandler} />
                    <Button type="submit" disabled={!formState.isValid}>{isLoginMode ? 'LOGIN' : 'SIGNUP'}</Button>
                </form>
                <Button inverse onClick={switchModeHandler}>SWITCH TO {isLoginMode ? 'SIGNUP' : 'LOGIN'}</Button>
            </Card>
        </React.Fragment>
    )
}

export default Authenticate;