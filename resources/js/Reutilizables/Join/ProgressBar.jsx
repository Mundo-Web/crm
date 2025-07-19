const ProgressBar = ({ value, className }) => {
    return <div className={`h-2 bg-[#BEC5FF] w-full rounded-full ${className}`}>
        <div className="bg-[#4621E1] h-full rounded-full transition-all" style={{ width: `${value}%` }} />
    </div>
}

export default ProgressBar