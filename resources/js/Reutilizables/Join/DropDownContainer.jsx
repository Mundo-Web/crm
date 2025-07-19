import { useEffect, useRef, useState } from "react";
import { renderToString } from "react-dom/server";

const DropDownContainer = ({ label, required, icon, value, values = [], onChange, searchable = false, disabled }) => {
    const labelRef = useRef()
    const containerRef = useRef()
    const searchRef = useRef()
    const [searchTerm, setSearchTerm] = useState('');
    const [ddOpen, setDdOpen] = useState(false);

    useEffect(() => {
        if (ddOpen && searchable) {
            setTimeout(() => { searchRef.current.focus() }, 0);
        }

        const handleClickOutside = (e) => {
            if (ddOpen &&
                !containerRef.current?.contains(e.target) &&
                !labelRef.current?.contains(e.target)) {
                setDdOpen(false)
                setSearchTerm('');
            }
        }

        document.addEventListener('click', handleClickOutside)
        return () => {
            document.removeEventListener('click', handleClickOutside)
        }
    }, [ddOpen])

    const selected = values.find(x => {
        if (typeof x == 'object') {
            return x.value == value
        } else {
            return x == value
        }
    })

    const filteredValues = values.filter(x => {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = renderToString(typeof x == 'object' ? x.label : x);
        const label = tempDiv.textContent;
        const normalizedLabel = label.toString().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const normalizedSearch = searchTerm.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        return normalizedLabel.includes(normalizedSearch);
    });


    useEffect(() => {
        if (disabled) setDdOpen(false);
    }, [disabled])

    return <div className="group relative w-full">
        <div className="relative">
            <label
                ref={labelRef}
                className={`flex gap-2 border-2 px-3 py-2 ${ddOpen ? 'border-[#4621E1]' : 'border-[#BEC5FF]'} rounded-lg bg-white cursor-pointer ${disabled && 'cursor-not-allowed'} transition-colors`}
                onClick={() => {
                    if (disabled) return
                    setDdOpen(!ddOpen)
                }}>
                {icon && <i className={icon}></i>}
                <div className={`relative w-[calc(100%-24px)] ${icon && "flex-1"}`}>
                    <span className="block text-xs font-semibold mb-1 select-none">
                        {label}
                        {required && <span className="text-[#FE4611] ms-1">*</span>}
                    </span>
                    <div className="relative w-full">
                        <div className="text-gray-700 truncate">{selected?.label ?? value}</div>
                        <i className={`absolute mdi mdi-chevron-down transition-transform ${ddOpen ? 'rotate-180' : ''} right-0 bottom-0`}></i>
                    </div>
                </div>
            </label>
            {ddOpen && (
                <div ref={containerRef} className="absolute z-10 w-full mt-1 bg-white rounded-lg shadow-lg">
                    {searchable && (
                        <div className="sticky top-0 bg-white border-b border-gray-200 rounded-t-lg">
                            <input
                                ref={searchRef}
                                type="text"
                                className="w-full px-3 py-2 border-0 text-sm border-gray-200 rounded-md focus:outline-none focus:border-[#4621E1]"
                                placeholder="Buscar..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                            />
                        </div>
                    )}
                    <div className={`max-h-[240px] overflow-auto rounded-b-lg ${!searchable && 'rounded-t-lg'}`}>
                        {
                            filteredValues.map((x, index) => {
                                let value = x
                                let label = x
                                if (typeof x == 'object') {
                                    value = x.value
                                    label = x.label
                                }
                                return <div key={index}
                                    className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm truncate w-full"
                                    onClick={() => {
                                        onChange({ target: { value, textContent: label } })
                                        setDdOpen(false);
                                        setSearchTerm('');
                                    }}
                                >
                                    {label}
                                </div>
                            })
                        }
                        {
                            filteredValues.length == 0 &&
                            <div className="px-3 py-2 text-sm w-full text-center text-gray-600">
                                No hay resultados
                            </div>
                        }
                    </div>
                </div>
            )}
        </div>
    </div>
}

export default DropDownContainer
