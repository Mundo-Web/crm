import React, { useRef, useState } from "react"
import Dropdown from "../../components/dropdown/DropDown"
import DropdownItem from "../../components/dropdown/DropdownItem"
import Tippy from "@tippyjs/react";

const StatusDropdown = ({ defaultValue, items: propItems = [], canCreate = false, canUpdate = false, onItemClick = () => { }, afterSave = () => { } }) => {

  const nameRef = useRef();
  const colorRef = useRef();

  const [items, setItems] = useState(propItems);

  const onAddStatusClicked = (e) => {
    e.stopPropagation()
    setItems(old => {
      return [...old.filter(x => x.id), { editing: true }]
    });
  }

  const onUpdateStatusClicked = (e, item) => {
    e.stopPropagation()
    setItems(old => {
      return old.map(x => {
        if (!x.id) return
        x.editing = x.id == item.id
        return x
      }).filter(Boolean)
    })
  }

  const onItemSave = (item) => {
    console.log('Item:', item)
    console.log('Color:', colorRef.current.value)
    console.log('Nombre:', nameRef.current.value)
  }

  const onItemCancel = (item) => {
    setItems(old => [...old.filter(x => {
      if (!x.id) return
      x.editing = false
      return x
    })])
  }

  return <Dropdown className='btn btn-white text-truncate' title={defaultValue.name} tippy='Actualizar estado' style={{
    border: 'none',
    borderRadius: '0',
    width: '179px',
    height: '39px',
    color: '#fff',
    fontWeight: 'bolder',
    backgroundColor: defaultValue.color
  }}>
    <div style={{
      maxHeight: '173px',
      overflowY: 'auto'
    }}>
      {
        items.sort((a, b) => a.order - b.order).map((item, index) => {
          const { name, color, editing } = item
          const uuid = `item-${crypto.randomUUID()}`
          return <DropdownItem key={index} onClick={(e) => editing ? e.stopPropagation() : onItemClick(item)} className={editing ? 'p-0' : 'p-2 show-button-child'}>
            {
              editing
                ? <div class="input-group">
                  <label htmlFor={uuid} className="input-group-text p-0 d-flex align-items-center" style={{ cursor: 'pointer' }}>
                    <input ref={colorRef} id={uuid} className="mx-1" type="color" defaultValue={color} style={{
                      padding: 0,
                      height: '25px',
                      width: '25px',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }} />
                  </label>
                  <input ref={nameRef} className="form-control" type="text" defaultValue={name} />
                  <Tippy content="Guardar">
                    <button class="btn input-group-text btn-xs btn-success waves-effect waves-light" type="button" onClick={() => onItemSave(item)}>
                      <i className="fa fa-check"></i>
                    </button>
                  </Tippy>
                  <Tippy content="Cancelar">
                    <button class="btn input-group-text btn-xs btn-danger waves-effect waves-light px-[10px]" type="button" onClick={() => onItemCancel(item)}>
                      <i className="fa fa-times"></i>
                    </button>
                  </Tippy>
                </div>
                : <>
                  <Tippy content='Editar'>
                    <button className="position-absolute btn btn-xs btn-soft-primary" style={{
                      top: '50%',
                      right: '8px',
                      transform: 'translateY(-50%)'
                    }} onClick={e => onUpdateStatusClicked(e, item)}>
                      <i className="fa fa-pen"></i>
                    </button>
                  </Tippy>
                  <i className='fa fa-circle me-2' style={{ color }}></i>
                  <span>{name}</span>
                </>
            }
          </DropdownItem>
        })
      }
    </div>
    {
      canCreate &&
      <>
        <DropdownItem onClick={onAddStatusClicked}>
          <i className='fa fa-plus me-2'></i>
          <span>Agregar estado</span>
        </DropdownItem>
      </>
    }
  </Dropdown>
}

export default StatusDropdown