import { useEffect, useState } from "react"

const MessageSkeleton = ({theme}) => {
    const [skeletonCount, setSkeletonCount] = useState(3)
    const [skeletonSides, setSkeletonSides] = useState([])

    useEffect(() => {
        const interval = setInterval(() => {
            const newCount = 3 + Math.floor(Math.random() * 5) // 3-7
            setSkeletonCount(newCount)
            setSkeletonSides(Array.from({ length: newCount }, () => Math.random() > 0.5))
        }, 1500)
        return () => clearInterval(interval)
    }, [null])

    return <>
        {Array.from({ length: skeletonCount }).map((_, idx) => {
            const lines = 1 + Math.floor(Math.random() * 3) // 1-3 líneas
            return (
                <li key={idx} className={skeletonSides[idx] ? 'odd' : ''} style={{ marginBottom: idx < skeletonCount - 1 ? '0px' : '24px', marginTop: idx > 0 && skeletonSides[idx] === skeletonSides[idx - 1] ? '3px' : '12px' }}>
                    <div className="message-list">
                        <div className="conversation-text">
                            <div className={`ctext-wrap ${skeletonSides[idx] ? `message-out-${theme}` : `message-in-${theme}`}`} style={{ boxShadow: 'rgba(11, 20, 26, 0.13) 0px 1px 0.5px 0px', padding: '6px 8px', width: `${300 + ((300 * (lines - 1)) / 6)}px` }}>
                                <div className="placeholder-glow">
                                    {Array.from({ length: lines }).map((_, lIdx) => (
                                        <span key={lIdx} className={`placeholder ${lIdx === lines - 1 ? 'col-6 ms-0' : 'col-12'} `} />
                                    ))}
                                    <span className="placeholder time float-end col-1" style={{ fontSize: '10px', marginLeft: '6px', marginTop: '8px !important' }} />
                                </div>
                            </div>
                        </div>
                    </div>
                </li>
            )
        })}
    </>
}

export default MessageSkeleton