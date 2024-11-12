import React, { useEffect, useRef } from "react"

const QuillFormGroup = ({ col, label, eRef = useRef(), value, required = false, theme = 'snow' }) => {
  const quillRef = useRef()

  useEffect(() => {
    const quill = new Quill(quillRef.current, {
      theme,
      modules: {
        toolbar: [
          ["bold", "italic", "underline", 'strike'],
          ["blockquote", "code-block"],
          [{ list: "ordered" }, { list: "bullet" }]]
      }
    })

    quill.on('text-change', () => {
      eRef.current.value = quill.root.innerHTML
    });
    eRef.editor = quill
  }, [null])

  return <div className={`form-group ${col} mb-2`} style={{ height: 'max-content' }}>
    <label htmlFor=''>
      {label} {required && <b className="text-danger">*</b>}
    </label>
    <div ref={quillRef} style={{height: '100px'}}>{value}</div>
    <input ref={eRef} type="hidden" required={required} />
  </div>
}

export default QuillFormGroup