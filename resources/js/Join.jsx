import { useEffect, useState } from "react";

import { createRoot } from "react-dom/client";
import CreateReactScript from "./Utils/CreateReactScript";
import JoinContainer from "./Reutilizables/Join/JoinContainer";
import { Session } from "sode-extend-react";

// Step Views
import AccountStep from "./Reutilizables/Join/AccountStep";
import UsageStep from "./Reutilizables/Join/UsageStep";
import SurveyStep from "./Reutilizables/Join/SurveyStep";
import InviteTeamStep from "./Reutilizables/Join/InviteTeamStep";
import DashboardStep from "./Reutilizables/Join/DashboardStep";
import ColumnsStep from "./Reutilizables/Join/ColumnsStep";
import ManageStep from "./Reutilizables/Join/ManageStep";
import StatusesStep from "./Reutilizables/Join/StatusesStep";
import JoinThanks from "./Reutilizables/Join/JoinThanks";
import JSEncrypt from "jsencrypt";
import Global from "./Utils/Global";

const Join = ({ PUBLIC_RSA_KEY }) => {
    const jsEncrypt = new JSEncrypt()
    jsEncrypt.setPublicKey(PUBLIC_RSA_KEY)

    const [step, setStep] = useState('usage');
    const [data, setData] = useState(Session.get('join-data') ?? {})

    console.clear()
    console.log(Object.keys(data).map(key => `${key}: ${data[key]}`).join('\n'))

    const getStepView = () => {
        switch (step) {
            case 'usage':
                return <UsageStep data={data} setData={setData} setStep={setStep} />
            case 'survey':
                return <SurveyStep data={data} setData={setData} setStep={setStep} />
            case 'invite-team':
                return <InviteTeamStep data={data} setData={setData} setStep={setStep} />
            case 'dashboard':
                return <DashboardStep data={data} setData={setData} setStep={setStep} />
            case 'columns':
                return <ColumnsStep data={data} setData={setData} setStep={setStep} />
            case 'manage':
                return <ManageStep data={data} setData={setData} setStep={setStep} />
            case 'statuses':
                return <StatusesStep data={data} setData={setData} setStep={setStep} />
            case 'saving':
                return <JoinThanks data={data} setData={setData} step={step} setStep={setStep} />
            case 'thanks':
                return <JoinThanks data={data} setData={setData} step={step} setStep={setStep} />
            default:
                return <UsageStep data={data} setData={setData} setStep={setStep} />
        }
    }

    useEffect(() => {
        Session.set('join-data', data)
    }, [data])

    useEffect(() => {
        document.title = `Join | ${Global.APP_NAME}`
    }, [null])

    return <JoinContainer step={step} setStep={setStep}>
        {getStepView()}
    </JoinContainer>
}

CreateReactScript((el, properties) => {
    createRoot(el).render(<Join {...properties} />);
})