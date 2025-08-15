import { useState } from "react"

const InputContainer = ({ label, children, className, required, icon, type = 'text', placeholder, value, onChange, onKeyDown, invalid, invalidText, disabled }) => {

    const [showPassword, setShowPassword] = useState(false)

    const onShowPassword = () => {
        setShowPassword(!showPassword)
    }
    let inputType = type
    if (type == 'password') {
        inputType = showPassword ? 'text' : 'password'
    }

    return <div className="group relative flex-1">
        <label className={`flex gap-2 border-2 px-3 py-2 border-[#BEC5FF] rounded-lg bg-white ${invalid ? 'border-[#FE4611]' : 'focus-within:border-[#4621E1]'} focus-within:cursor-text ${disabled ? 'cursor-not-allowed': 'cursor-pointer'} transition-colors ${className}`}>
            {icon && <i className={icon}></i>}
            <div className={`${icon ? "flex-1" : "w-full"} transition-all`}>
                <span className="block text-xs font-semibold mb-1 select-none">
                    {label}
                    {required && <span className="text-[#FE4611] ms-1">*</span>}
                </span>
                <div className="relative">
                    <input
                        type={inputType}
                        className="border-0 outline-none bg-transparent w-full cursor-pointer focus:cursor-text disabled:cursor-not-allowed"
                        placeholder={placeholder}
                        value={value}
                        onChange={onChange}
                        onKeyDown={onKeyDown}
                        required={required}
                        disabled={disabled} />
                    {
                        type == 'password' &&
                        <span type="button" className="absolute right-0 select-none cursor-pointer" onClick={onShowPassword}>
                            {
                                showPassword ?
                                    <i className="mdi mdi-eye"></i>
                                    :
                                    <i className="mdi mdi-eye-off"></i>
                            }
                        </span>
                    }
                </div>
                {invalid && <span className="text-[#FE4611] block text-xs mt-1">{invalidText}</span>}
            </div>
            {children}
        </label>
    </div>
}

export default InputContainer