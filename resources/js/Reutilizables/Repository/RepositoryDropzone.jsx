import React, { useEffect, useRef, useState } from 'react'
import { Clipboard, Notify } from 'sode-extend-react'
import '../../../css/repository.css'
import Tippy from '@tippyjs/react'
import Swal from 'sweetalert2'
import RepositoryRest from '../../actions/RepositoryRest.js'
import Global from '../../Utils/Global.js'
import Modal from '../../components/Modal.jsx'
import InputFormGroup from '../../components/form/InputFormGroup.jsx'

const repositoryRest = new RepositoryRest()
const MAX_FILE_SIZE = 40 * 1024 * 1024 // 40MB in bytes

const getFileIcon = (type) => {
  if (type.startsWith('image/')) return 'mdi-image'
  if (type.startsWith('video/')) return 'mdi-video'
  if (type.startsWith('audio/')) return 'mdi-music'
  if (type.includes('pdf')) return 'mdi-file-pdf'
  if (type.includes('word')) return 'mdi-file-word'
  if (type.includes('sheet')) return 'mdi-file-excel'
  return 'mdi-file'
}

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const RepositoryDropzone = ({ files: filesDB, height = 'calc(100vh - 240px)', selectable, multiple = true, selectedFiles = [], setSelectedFiles = () => { } }) => {
  const modalRef = useRef()

  const fileInputRef = useRef()
  const idRef = useRef()
  const nameRef = useRef()
  const lastNameRef = useRef()

  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [files, setFiles] = useState(filesDB || [])

  const handleDragEnter = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files)
    handleFiles(files)
  }

  const handleFileInput = (e) => {
    const files = Array.from(e.target.files)
    handleFiles(files)
    fileInputRef.current.value = null
  }

  const handleFiles = async (files) => {
    setUploading(true)
    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        Notify.add({
          title: 'Error',
          type: 'danger',
          body: `El archivo ${file.name} excede el límite de 40MB`,
          icon: '/assets/img/icon.svg'
        })
        continue
      }

      const formData = new FormData()
      formData.append('name', file.name);
      formData.append('file', file)

      try {
        const result = await repositoryRest.save(formData, false)
        if (result) {
          setFiles(prevFiles => [...prevFiles, result])
          Notify.add({
            title: 'Operación correcta',
            body: `Archivo ${file.name} subido correctamente`,
            icon: '/assets/img/icon.svg'
          })
        }
      } catch (error) {
        Notify.add({
          title: 'Error',
          type: 'danger',
          body: `Error al subir ${file.name}`,
          icon: '/assets/img/icon.svg'
        })
      }
    }
    setUploading(false)
  }

  const onModalOpen = (file) => {
    idRef.current.value = file.id
    lastNameRef.current.value = file.name
    nameRef.current.value = file.name

    $(modalRef.current).modal('show');
  }

  const onModalSubmit = async (e) => {
    e.preventDefault()

    const formData = new FormData()
    formData.append('id', idRef.current.value);
    formData.append('name', nameRef.current.value);

    const result = await repositoryRest.save(formData)
    if (!result) return

    setFiles(prevFiles => prevFiles.map(file => file.id === result.id ? result : file))

    $(modalRef.current).modal('hide')
  }

  const onCopyLinkClicked = ({ name, file }) => {
    const download_link = `${Global.APP_URL}/cloud/${file}`
    Clipboard.copy(download_link, () => {
      Notify.add({
        title: 'Enlace copiado',
        body: `El enlace al archivo ${name} ha sido copiado al portapapeles`,
        icon: '/assets/img/icon.svg'
      })
    })
  }

  const onDeleteClicked = async (fileId) => {
    const { isConfirmed } = await Swal.fire({
      title: '¿Estás seguro?',
      text: '¿Estás seguro de que deseas eliminar este archivo?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    })
    if (!isConfirmed) return
    const result = await repositoryRest.delete(fileId)
    if (!result) return
    setFiles(prevFiles => prevFiles.filter(file => file.id !== fileId))
  }

  const getFiles = async () => {
    const result = await repositoryRest.paginate({ isLoadingAll: true })
    if (!result) return
    setFiles(result.data)
  }

  useEffect(() => {
    if (files.length == 0) getFiles()
  }, [null])

  const onSelectionChange = (e, file) => {
    const isChecked = e.target.checked

    if (!multiple) return setSelectedFiles([file])

    if (isChecked) {
      setSelectedFiles(prevSelectedFiles => [...prevSelectedFiles, file])
    } else {
      setSelectedFiles(prevSelectedFiles => prevSelectedFiles.filter(x => x.id !== file.id))
    }
  }

  return (
    <>
      <div
        className={`${isDragging ? 'dragging' : ''}`}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="mb-2">
          <input
            type="file"
            ref={fileInputRef}
            className="d-none"
            multiple
            onChange={handleFileInput}
          />
          <button
            className="btn btn-sm btn-primary"
            onClick={() => fileInputRef.current.click()}
            disabled={uploading}
            type='button'
          >
            {uploading ? (
              <>
                <i className="mdi mdi-loading mdi-spin me-1"></i>
                Subiendo...
              </>
            ) : (
              <>
                <i className="mdi mdi-upload me-1"></i>
                Subir archivos
              </>
            )}
          </button>
        </div>

        <div className="repository-dropzone" style={{ height, userSelect: 'none' }}>
          {isDragging ? (
            <div className="drop-overlay">
              <i className="mdi mdi-cloud-upload mdi-48px mb-2"></i>
              <h4>Suelta los archivos aquí</h4>
            </div>
          ) : files.length > 0 ? (
            <div className="d-flex flex-wrap align-items-center justify-content-center gap-2">
              {files.map((file, index) => {
                const found = selectedFiles.find(selectedFile => selectedFile.id === file.id)
                return <div key={index} className="card my-0"
                  style={{
                    width: '140px',
                    height: 'max-content',
                    boxShadow: '5px 5px 10px rgba(0, 0, 0, 0.2)',
                  }}>
                  <label href={`${Global.APP_URL}/cloud/${file.file}`} className="rounded position-relative w-100 bg-dark d-flex align-items-center justify-content-center text-white cursor-pointer" style={{ aspectRatio: 5 / 3 }}
                    onClick={() => {
                      if (selectable) return
                      else {
                        const a = document.createElement('a')
                        a.href = `${Global.APP_URL}/cloud/${file.file}`
                        a.download = `${file.name}.${file.file_extension || 'enc'}`
                        a.click()
                        a.remove()
                      }
                    }}>
                    {
                      selectable &&
                      <input name='input-file-selectable' type={multiple ? 'checkbox' : 'radio'} className='position-absolute form-check-input m-0' style={{
                        top: '6px',
                        left: '6px'
                      }} checked={!!found} onChange={(e) => onSelectionChange(e, file)} />
                    }
                    {
                      file.file_mimetype.startsWith('image/') && file.file_mimetype !== 'image/svg+xml'
                        ? <img className="rounded img-fluid w-100 h-100" src={`/cloud/${file.file}`} alt={file.name} style={{
                          objectFit: 'cover',
                          objectPosition: 'center',
                          aspectRatio: 5 / 3
                        }} />
                        : <i className={`mdi ${getFileIcon(file.file_mimetype)} mdi-36px`}></i>
                    }
                  </label>
                  <div className="card-body p-1">
                    <small className="d-block text-truncate w-100 my-0" title={file.name}><b>{file.name}</b></small>
                    <div className='d-flex gap-2 justify-content-between align-items-center'>
                      <small className="card-text">{formatFileSize(file.file_size)}</small>
                      {
                        !selectable &&
                        <div className='d-flex gap-1'>
                          <Tippy content='Copiar enlace'>
                            <i className='mdi mdi-link cursor-pointer' onClick={() => onCopyLinkClicked(file)}></i>
                          </Tippy>
                          <Tippy content='Cambiar nombre'>
                            <i className='mdi mdi-pencil cursor-pointer' onClick={() => onModalOpen(file)}></i>
                          </Tippy>
                          <Tippy content='Eliminar'>
                            <i className='mdi mdi-delete cursor-pointer text-danger' onClick={() => onDeleteClicked(file.id)}></i>
                          </Tippy>
                        </div>
                      }
                    </div>
                  </div>
                </div>
              })}
            </div>
          ) : (
            <div className="text-center p-5">
              <i className="mdi mdi-folder-multiple-outline mdi-48px mb-2"></i>
              <h4>Arrastra archivos aquí o usa el botón de subir</h4>
              <small className="text-muted">Tamaño máximo por archivo: 40MB</small>
            </div>
          )}
        </div>
      </div>
      <Modal modalRef={modalRef} title='Modificar nombre' onSubmit={onModalSubmit} zIndex={1070}>
        <input ref={idRef} type="hidden" />
        <InputFormGroup eRef={lastNameRef} label='Nombre anterior' disabled />
        <InputFormGroup eRef={nameRef} label='Nombre nuevo' required />
      </Modal>
    </>
  )
};

export default RepositoryDropzone