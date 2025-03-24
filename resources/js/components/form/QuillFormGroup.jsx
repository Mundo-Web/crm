import React, { useEffect, useRef } from "react"
import Quill from 'quill'
import "quill-mention/autoregister"

const QuillFormGroup = ({ col, label, eRef = useRef(), value, required = false, theme = 'snow',
  mention, mentionSource, mentionDenotationChars = ['@', '#']
}) => {
  const quillRef = useRef()

  useEffect(() => {
    $(quillRef.current).parent().find('.ql-toolbar').remove()
    const quill = new Quill(quillRef.current, {
      theme,
      modules: {
        toolbar: [
          ["bold", "italic", "underline", 'strike'],
          ["blockquote", "code-block"],
          [
            { list: "ordered" },
            { list: "bullet" }
          ]
        ],
        mention: mention ? {
          allowedChars: /^[A-Za-z\sÅÄÖåäö]*$/,
          mentionDenotationChars,
          source: mentionSource,
        } : undefined
      }
    })

    quill.on('text-change', () => {
      eRef.current.value = quill.root.innerHTML
    });
    eRef.editor = quill
  }, [null])

  return <div data-id="quill-form-group" className={`form-group ${col} mb-2`} style={{ height: 'max-content' }}>
    <label htmlFor='' className='form-label'>
      {label} {required && <b className="text-danger">*</b>}
    </label>
    <div ref={quillRef} style={{ minHeight: '162px' }}>{value}</div>
    <input ref={eRef} type="hidden" required={required} />
  </div>
}

export default QuillFormGroup