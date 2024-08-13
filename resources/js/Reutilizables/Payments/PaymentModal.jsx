import React, { useEffect, useRef, useState } from "react";
import Modal from "../../components/Modal";
import InputFormGroup from "../../components/form/InputFormGroup";
import Tippy from "@tippyjs/react";
import 'tippy.js/dist/tippy.css';
import PaymentsRest from "../../actions/PaymentsRest";
import TippyButton from "../../components/form/TippyButton";
import Swal from "sweetalert2";
import { set } from "sode-extend-react/sources/cookies";

const PaymentModal = ({ can, dataLoaded, setDataLoaded, grid2refresh }) => {

  const modalPaymentRef = useRef()

  const idRef = useRef()
  const projectIdRef = useRef()
  const paymentTypeRef = useRef()
  const dateRef = useRef()
  const paymentAmountRef = useRef()

  const [payments, setPayments] = useState([])
  const [isEditing, setIsEditing] = useState(false)
  const [maxAmount, setMaxAmount] = useState(Number(dataLoaded?.remaining_amount))

  useEffect(() => {
    if (dataLoaded.id) {
      onPaymentModalOpen()
    }

    $(modalPaymentRef.current).on('hidden.bs.modal', () => {
      setDataLoaded({})
      setPayments([])
      setIsEditing(false)
      idRef.current.value = null
      projectIdRef.current.value = null
      paymentTypeRef.current.value = null
      paymentAmountRef.current.value = null
    })
  }, [dataLoaded])


  const onPaymentModalOpen = async () => {
    const paymentsByProject = await PaymentsRest.byProject(dataLoaded?.id)
    setPayments(paymentsByProject)
    setMaxAmount(Number(dataLoaded?.remaining_amount))

    projectIdRef.current.value = dataLoaded?.id || null
    $(modalPaymentRef.current).modal('show')
  }

  const onPaymentSubmit = async (e) => {
    e.preventDefault()
    const request = {
      id: idRef.current.value || undefined,
      payment_id: projectIdRef.current.value,
      project_id: dataLoaded.id,
      payment_type: paymentTypeRef.current.value,
      amount: paymentAmountRef.current.value,
      date: dateRef.current.value
    }

    const result = await PaymentsRest.save(request)
    if (!result) return

    idRef.current.value = null
    dateRef.current.value = null
    paymentTypeRef.current.value = null
    paymentAmountRef.current.value = null

    await reloadPayment()
    grid2refresh.refresh()
  }

  const reloadPayment = async () => {
    const paymentsByProject = await PaymentsRest.byProject(dataLoaded.id)
    const total_payments = paymentsByProject.reduce((acc, payment) => Number(acc) + Number(payment.amount), 0)
    const newDataLoaded = { ...dataLoaded, total_payments, remaining_amount: dataLoaded.cost - total_payments }
    setDataLoaded(newDataLoaded)
    setPayments(paymentsByProject)
  }

  const onEditPayment = async (payment) => {
    idRef.current.value = payment.id
    paymentTypeRef.current.value = payment.payment_type
    paymentAmountRef.current.value = payment.amount
    dateRef.current.value = payment.date || moment(payment.created_at).format('YYYY-MM-DD')
    setMaxAmount(Number(dataLoaded?.remaining_amount) + Number(payment.amount))
    setIsEditing(true)
  }

  const onDeletePayment = async (payment_id) => {
    const { isConfirmed } = await Swal.fire({
      title: "Estas seguro de eliminar este pago?",
      text: "No podras revertir esto!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Continuar",
      cancelButtonText: `Cancelar`
    })
    if (!isConfirmed) return

    const result = await PaymentsRest.delete(payment_id)
    if (!result) return
    await reloadPayment()
    grid2refresh.refresh()
  }

  return (
    <Modal modalRef={modalPaymentRef} title={`Pagos de ${dataLoaded?.name} - S/.${dataLoaded?.cost}`} onSubmit={onPaymentSubmit} hideButtonSubmit>
      <div className={`row ${!can('projects', 'all', 'addpayment', 'editpayment') && 'd-none'}`}>
        <input ref={projectIdRef} type='hidden' />
        <input ref={idRef} type="hidden" />
        <InputFormGroup eRef={paymentTypeRef} label='Concepto' col='col-12' required />
        <InputFormGroup eRef={dateRef} type="date" label='Fecha' col='col-md-7' required />
        <div className='form-group col-md-5'>
          <label>Monto <b className='text-danger'>*</b></label>
          <div className='input-group' >
            <input ref={paymentAmountRef} type='number' className='form-control' placeholder={`Max: ${maxAmount}`} min={0} max={maxAmount || 0} step={0.01} />
            <Tippy content={isEditing ? 'Actualizar pago' : 'Agregar pago'}>
              <button className='btn input-group-text btn-dark waves-effect waves-light' type='submit'>
                <i className={`fa ${isEditing ? 'fa-save' : 'fa-plus'}`}></i>
              </button>
            </Tippy>
          </div>
        </div>
      </div>
      <hr className="mb-2 mt-0" />
      <table className='table table-bordered table-sm table-responsive table-striped mb-2'>
        <thead>
          <tr>
            {
              can('projects', 'all', 'editpayment', 'deletepayment') && <th></th>
            }
            <th>Concepto</th>
            <th>Fecha</th>
            <th>Monto</th>
          </tr>
        </thead>
        <tbody>{payments.map(x => {
          if (!x.date) x.date = moment(x.created_at).format('YYYY-MM-DD')
          return x
        }).sort((a, b) => new Date(a.date) - new Date(b.date)).map(payment => {
          return <tr key={`project-payment-${payment.id}`}>
            {
              can('projects', 'all', 'editpayment', 'deletepayment') && <td>
                <div className="d-flex align-items-center gap-1">
                  {
                    can('projects', 'all', 'editpayment') && <TippyButton title='Editar pago' className='btn btn-xs btn-soft-primary' type='button' onClick={() => onEditPayment(payment)}>
                      <i className="fa fa-pen"></i>
                    </TippyButton>
                  }
                  {
                    can('projects', 'all', 'deletepayment') && <TippyButton title='Eliminar pago' className='btn btn-xs btn-soft-danger' type='button' onClick={() => onDeletePayment(payment.id)}>
                      <i className="fa fa-trash"></i>
                    </TippyButton>
                  }
                </div>
              </td>
            }
            <td>{payment.payment_type}</td>
            <td>{moment(payment.date).format('LL')}</td>
            <td>S/.{payment.amount}</td>
          </tr>
        })}</tbody>
      </table>
      <table className='table table-bordered table-sm table-responsive table-striped mb-0' style={{ width: 'max-content', float: 'right' }}>
        <tbody>
          <tr>
            <th colSpan={3} className='text-end'>Pagado</th>
            <td>S/.{dataLoaded?.total_payments}</td>
          </tr>
          <tr>
            <th colSpan={3} className='text-end'>Por pagar</th>
            <td>S/.{dataLoaded?.remaining_amount}</td>
          </tr>
        </tbody>
      </table>
    </Modal>
  )
}

export default PaymentModal;