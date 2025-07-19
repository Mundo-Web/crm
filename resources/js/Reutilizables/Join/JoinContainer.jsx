import PasswordImage from '/resources/img/join/password-image.png'
import BusinessImage from '/resources/img/join/business-image.png'
import UsageImage from '/resources/img/join/usage-image.png'
import SurveyImage from '/resources/img/join/survey-image.png'
import InviteTeamImage from '/resources/img/join/invite-team-image.png'
import DashboardImage from '/resources/img/join/dashboard-image.png'
import ColumnsImage from '/resources/img/join/columns-image.png'
import ManageImage from '/resources/img/join/manage-image.png'
import StatusesImage from '/resources/img/join/statuses-image.png'
import ProgressBar from './ProgressBar'
import Global from '../../Utils/Global'

const images = [
    { key: 'account', color: '#4621E1', image: PasswordImage },
    { key: 'business', color: '#FF6C37', image: BusinessImage },
    { key: 'usage', color: '#50C4FF', image: UsageImage, showProgressBar: true },
    { key: 'survey', color: '#5633FE', image: SurveyImage, showProgressBar: true },
    { key: 'invite-team', color: '#FF6C37', image: InviteTeamImage, showProgressBar: true },
    { key: 'dashboard', color: '#4621E1', image: DashboardImage, showProgressBar: true },
    { key: 'columns', color: '#50C4FF', image: ColumnsImage, showProgressBar: true },
    { key: 'manage', color: '#5633FE', image: ManageImage, showProgressBar: true },
    { key: 'statuses', color: '#FF6C37', image: StatusesImage, showProgressBar: true },
]

const steps = images.map(x => x.key)

const JoinContainer = ({ children, step, setStep }) => {
    const { color: stepColor, image: stepImage, showProgressBar } = images.find((item) => item.key === step) || {}

    const currentStep = steps.indexOf(step)

    const onPrevClicked = () => {
        let newStep = currentStep - 1
        if (newStep < 0) {
            return location.replace('/')
        }
        setStep(steps[newStep])
    }

    const stepsWPB = images.filter(({ showProgressBar }) => showProgressBar)
    const stepWPBPosition = stepsWPB.findIndex(({ key }) => key == step)
    const percent = ((stepWPBPosition + 1) / (stepsWPB.length + 1)) * 100

    return <main className="text-[#000938] bg-no-repeat bg-cover bg-fixed bg-center">
        <header className="bg-white shadow-lg">
            <div className="max-w-7xl w-full mx-auto relative flex items-center justify-center py-4 px-4 sm:px-6 lg:px-8">
                {
                    step != 'thanks' && step != 'saving' &&
                    <button className="absolute left-4 sm:left-6 lg:left-8 px-2 flex items-center hover:bg-gray-100 rounded-full" onClick={onPrevClicked}>
                        <i className="mdi mdi-chevron-left mdi-24px"></i>
                        <span className="hidden md:block mx-2">{currentStep == 0 ? 'Volver a inicio' : 'Volver'}</span>
                        {currentStep == 0 && <span className='block md:hidden mx-2'>Inicio</span>}
                    </button>
                }
                <a href="/" className="transition-transform hover:scale-105">
                    <img src={`//${Global.APP_DOMAIN}/assets/img/logo-dark.svg`} alt="" style={{ height: '32px' }} />
                </a>
            </div>
        </header>
        <section className="relative bg-[#f8f8f8]">
            <img
                className='absolute top-0 left-0 w-full h-full z-0'
                src="/assets/img/background-auth.png"
            />
            <div className={` max-w-7xl mx-auto flex flex-col md:flex-row z-10 ${step == 'thanks' || step == 'saving' ? 'items-center justify-center' : 'items-start'}`}>
                <div className={`relative h-[calc(100vh-144px)] md:h-[calc(100vh-116px)] overflow-y-auto w-full p-6 md:p-12 z-10  ${step == 'thanks' || step == 'saving' ? 'justify-center items-center' : 'md:w-1/2  justify-start'}`}>
                    {
                        showProgressBar && <>
                            <ProgressBar className='mb-8' value={percent} />
                            <img src="//crm.atalaya.localhost/assets/img/logo-dark.svg" alt='Atalaya CRM' className="h-8 w-max mb-8" onError={(e) => e.target.src = '/assets/img/logo-dark.svg'} />
                        </>
                    }
                    {children}
                </div>
                {
                    step != 'thanks' && step != 'saving' &&
                    <div className="hidden md:absolute left-1/2 right-0 bottom-0 top-0 p-10 md:flex items-center justify-center transition-colors" style={{
                        backgroundColor: stepColor
                    }}>
                        <img src={stepImage} alt="Atalaya Join image" className="max-w-[420px] w-full h-full max-h-[360px] object-contain transition-all animate-bounce animate-duration-[10s]" />
                    </div>
                }
            </div>
        </section>
        <footer className="bg-white shadow-lg">
            <div className="max-w-7xl w-full mx-auto relative flex flex-col md:flex-row gap-2 items-center justify-between py-4 px-4 sm:px-6 lg:px-8 text-sm">
                <span>{new Date().getFullYear()} &copy; Atalaya | Propiedad de <a href="//mundoweb.pe" target="_blank" className="text-[#fe4611]">MundoWeb</a></span>
                <span>Powered By MundoWeb</span>
            </div>
        </footer>
    </main>
}
export default JoinContainer