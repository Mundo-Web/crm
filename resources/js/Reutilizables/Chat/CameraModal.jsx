import { useEffect, useRef, useState } from "react"

const CameraModal = ({ isOpen, setIsOpen, onTakePhoto }) => {
    const videoRef = useRef()
    const canvasRef = useRef()

    const [cameraStream, setCameraStream] = useState(null)

    const handleTakePhoto = () => {
        const canvas = canvasRef.current
        const video = videoRef.current
        if (!canvas || !video) return

        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        const ctx = canvas.getContext('2d')
        ctx.drawImage(video, 0, 0)
        canvas.toBlob((blob) => {
            onTakePhoto(blob)
            setIsOpen(false)
        }, 'image/jpeg', 0.95)
    }

    useEffect(() => {
        if (isOpen && cameraStream && videoRef.current) {
            videoRef.current.srcObject = cameraStream
        }
    }, [isOpen, cameraStream])

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true })
            setCameraStream(stream)
        } catch (err) {
            console.error('Error accessing camera:', err)
        }
    }

    useEffect(() => {
        if (isOpen) {
            startCamera()
        } else if (cameraStream) {
            cameraStream.getTracks().forEach(track => track.stop())
            setCameraStream(null)
        }
    }, [isOpen])

    if (!isOpen) return <></>
    return <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{ backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 9999 }}>
        <div className="card" style={{ width: '90%', maxWidth: '500px' }}>
            <div className="card-header d-flex justify-content-between" bis_skin_checked="1">
                <h4 className="header-title my-0">Cámara</h4>
                <button type="button" class="btn-close" onClick={() => setIsOpen(false)}></button>
            </div>
            <div className="card-body p-0 position-relative">
                <video ref={videoRef} autoPlay playsInline muted className="w-100" style={{ maxHeight: '400px' }} />
                <canvas ref={canvasRef} className="d-none" />
                <span className="position-absolute bg-white"
                    onClick={handleTakePhoto}
                    style={{
                        width: '40px',
                        height: '40px',
                        bottom: '24px',
                        borderRadius: '50%',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        cursor: 'pointer'
                    }} />
            </div>
        </div>
    </div>
}

export default CameraModal