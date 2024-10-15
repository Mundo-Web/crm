
import React, { useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import CreateReactScript from './Utils/CreateReactScript.jsx'
import ReactAppend from './Utils/ReactAppend.jsx'
import PermissionsRest from './actions/PermissionsRest.js'
import RolesRest from './actions/RolesRest.js'
import Adminto from './components/Adminto.jsx'
import Modal from './components/Modal.jsx'
import Table from './components/Table.jsx'
import AccordionCard from './components/accordion/AccordionCard.jsx'
import CheckboxFormGroup from './components/form/CheckboxFormGroup.jsx'
import InputFormGroup from './components/form/InputFormGroup.jsx'
import TextareaFormGroup from './components/form/TextareaFormGroup.jsx'
import TippyButton from './components/form/TippyButton.jsx'
import DxPanelButton from './components/dx/DxPanelButton.jsx'
import ProductsRest from './actions/ProductsRest.js'
import ProductCard from './Reutilizables/Products/ProductCard.jsx'
import Tippy from '@tippyjs/react'
import SelectFormGroup from './components/form/SelectFormGroup.jsx'
import Swal from 'sweetalert2'

const productsRest = new ProductsRest()

const Products = ({ products = [], types = [], can }) => {
  const gridRef = useRef()
  const modalRef = useRef()

  // Form elements ref
  const idRef = useRef()
  const typeRef = useRef()
  const nameRef = useRef()
  const priceRef = useRef()
  const colorRef = useRef()
  const descriptionRef = useRef()

  const [isEditing, setIsEditing] = useState(false)

  const onModalOpen = (data) => {
    if (data?.id) setIsEditing(true)
    else setIsEditing(false)

    idRef.current.value = data?.id || null
    $(typeRef.current).val(data?.type || null)
    nameRef.current.value = data?.name || null
    priceRef.current.value = data?.price || null
    colorRef.current.value = data?.color || null
    descriptionRef.current.value = data?.description || null

    $(modalRef.current).modal('show')
  }

  const onModalSubmit = async (e) => {
    e.preventDefault()

    const request = {
      id: idRef.current.value || undefined,
      type: typeRef.current.value,
      name: nameRef.current.value,
      price: priceRef.current.value,
      color: colorRef.current.value,
      description: descriptionRef.current.value
    }

    const result = await productsRest.save(request)
    if (!result) return

    $(modalRef.current).modal('hide')
  }

  const onDeleteClicked = async (id) => {
    const { isConfirmed } = await Swal.fire({
      title: "Estas seguro?",
      text: `No podras revertir esta accion!`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Continuar",
      cancelButtonText: `Cancelar`
    })
    if (!isConfirmed) return

    const result = await productsRest.delete(id)
    if (!result) return
    $(gridRef.current).dxDataGrid('instance').refresh()
  }

  return (<>
    <div className="row mb-4">
      <div className='text-center'>
        <button className='btn btn-success btn-sm' onClick={onModalOpen}>
          <i className='fa fa-plus me-1'></i>
          Agregar producto
        </button>
      </div>
    </div>
    <div className="d-flex flex-wrap align-items-center justify-content-center gap-3" style={{
      height: 'max-height'
    }}>
      {
        products.map((product, index) => {
          return <ProductCard key={index} style={{ width: '300px' }}>
            <h4 className={`${product.ribbon ? 'ms-4' : ''} text-center text-truncate line-clamp-2`}>{product.name}</h4>
            <table>
              <tbody>
                <tr>
                  <td style={{ width: '100%' }}>
                    <small className='mb-1' style={{
                      overflow: 'hidden',
                      display: '-webkit-box',
                      WebkitBoxOrient: 'vertical',
                      WebkitLineClamp: 2,
                      height: '36px'
                    }}>{product.description || '- Sin descripción -'}</small>
                    <b>S/.{Number(product.price).toFixed(2)}</b>
                  </td>
                  <td className='text-end'>
                    <Tippy content='Editar'>
                      <button className="btn btn-xs btn-soft-primary fa fa-pen mb-1" onClick={() => onModalOpen(product)}></button>
                    </Tippy>
                    <Tippy content='Eliminar'>
                      <button className="btn btn-xs btn-soft-danger fa fa-times" onClick={() => onDeleteClicked(product.id)}></button>
                    </Tippy>
                  </td>
                </tr>
              </tbody>
            </table>
          </ProductCard>
        })
      }
    </div>
    <Modal modalRef={modalRef} title={isEditing ? 'Editar producto' : 'Agregar producto'} onSubmit={onModalSubmit} size='sm'>
      <div className='row' id='main-container'>
        <input ref={idRef} type='hidden' />
        <SelectFormGroup eRef={typeRef} label='Tipo de producto' dropdownParent='#main-container' tags required>
          {types.map((type, index) => {
            return <option key={index} value={type.id}>{type.name}</option>
          })}
        </SelectFormGroup>
        <InputFormGroup eRef={nameRef} label='Producto' col='col-12' required />
        <InputFormGroup eRef={priceRef} label='Precio' col='col-12' type='number' step={0.01} />
        <InputFormGroup eRef={colorRef} label='Color (Referencial)' col='col-12' type='color' />
        <TextareaFormGroup eRef={descriptionRef} label='Descripcion' col='col-12' />
      </div>
    </Modal>
  </>
  )
};

CreateReactScript((el, properties) => {
  createRoot(el).render(
    <Adminto {...properties} title='Productos'>
      <Products {...properties} />
    </Adminto>
  );
})