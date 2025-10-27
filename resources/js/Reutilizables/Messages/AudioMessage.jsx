import React, { useEffect, useRef, useState } from "react";

const AudioMessage = ({ fromMe, theme, url, avatar, time }) => {
    const [playing, setPlaying] = useState(false);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const audioRef = useRef(null);

    const togglePlay = () => {
        const audio = audioRef.current;
        if (!audio) return;
        if (playing) {
            audio.pause();
        } else {
            audio.play();
        }
        setPlaying(!playing);
    };

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const onLoadedMetadata = () => setDuration(Math.floor(audio.duration));
        const onTimeUpdate = () => setCurrentTime(Math.floor(audio.currentTime));
        const onEnded = () => {
            setPlaying(false);
            setCurrentTime(0);
        };

        audio.addEventListener('loadedmetadata', onLoadedMetadata);
        audio.addEventListener('timeupdate', onTimeUpdate);
        audio.addEventListener('ended', onEnded);

        return () => {
            audio.removeEventListener('loadedmetadata', onLoadedMetadata);
            audio.removeEventListener('timeupdate', onTimeUpdate);
            audio.removeEventListener('ended', onEnded);
        };
    }, []);

    const progress = duration ? (currentTime / duration) * 100 : 0;

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    return (
        <div
            className={`ctext-wrap d-flex align-items-start ${fromMe ? `message-out-${theme}` : `message-in-${theme}`}`}
            style={{ minWidth: '240px', maxWidth: '320px', padding: '6px 8px' }}
        >
            {avatar && (
                <img
                    src={avatar}
                    alt="avatar"
                    className="rounded-circle me-2"
                    onError={(e) => { e.target.src = `//${Global.APP_DOMAIN}/assets/img/user-404.svg`; }}
                    style={{ width: '40px', height: '40px', objectFit: 'cover' }}
                />
            )}
            <div className="flex-grow-1">
                <div className="d-flex align-items-center mb-1">
                    <button
                        onClick={togglePlay}
                        className="btn btn-sm d-flex align-items-center justify-content-center rounded-circle me-2"
                        style={{
                            width: '32px',
                            height: '32px',
                            backgroundColor: 'rgba(255,255,255,0.25)',
                            border: 'none',
                            color: '#fff',
                            flexShrink: 0
                        }}
                    >
                        <i className={`mdi mdi-${playing ? 'pause' : 'play'}`} style={{ fontSize: '16px' }}></i>
                    </button>
                    <div className="flex-grow-1" style={{ height: '4px', backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: '2px', position: 'relative' }}>
                        <div
                            style={{
                                height: '100%',
                                width: `${progress}%`,
                                backgroundColor: '#fff',
                                borderRadius: '2px',
                                transition: 'width 0.2s ease'
                            }}
                        ></div>
                    </div>
                </div>
                <div className="d-flex justify-content-between align-items-center px-1" style={{ fontSize: '10px', color: 'rgba(255,255,255,0.7)' }}>
                    <span>{formatTime(duration)}</span>
                    <span className="time mt-0 float-end" style={{ fontSize: '10px', marginLeft: '6px', marginTop: '8px !important' }}>{time}</span>
                </div>
            </div>
            <audio ref={audioRef} src={url} preload="metadata"></audio>
        </div>
    );
};

export default AudioMessage;
