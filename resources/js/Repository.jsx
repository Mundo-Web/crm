import React, { useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import CreateReactScript from './Utils/CreateReactScript.jsx'
import Adminto from './components/Adminto.jsx'
import RepositoryRest from './actions/RepositoryRest.js'
import { Clipboard, Notify } from 'sode-extend-react'
import '../css/repository.css'
import Tippy from '@tippyjs/react'
import Global from './Utils/Global.js'
import Swal from 'sweetalert2'
import Modal from './components/Modal.jsx'
import InputFormGroup from './components/form/InputFormGroup.jsx'
import RepositoryDropzone from './Reutilizables/Repository/RepositoryDropzone.jsx'

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

const Repository = ({ files: filesDB }) => {
  return (
    <>
      <div className='repository-container'>
        <RepositoryDropzone files={filesDB} />
      </div>
    </>
  )
};

CreateReactScript((el, properties) => {
  createRoot(el).render(
    <Adminto {...properties} title='Repositorio'>
      <Repository {...properties} />
    </Adminto>
  );
})