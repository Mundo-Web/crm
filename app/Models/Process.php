<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Process extends Model
{
    use HasFactory, HasUuids;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'name',
        'description',
        'status',
        'business_id',
    ];

    public static function getDefaultProcesses(): array
    {
        return [
            ['name' => '📞 Llamada inicial', 'description' => 'Primer contacto telefónico con el prospecto para conocer sus necesidades, presentar la solución y determinar su nivel de interés.'],
            ['name' => '📲 Re llamada', 'description' => 'Nueva llamada de seguimiento para continuar una conversación pendiente o intentar establecer contacto nuevamente.'],
            ['name' => '📩 Envío de mensaje', 'description' => 'Envío de un mensaje al prospecto o cliente para brindar información, realizar seguimiento o coordinar una acción.'],
            ['name' => '📧 Envío de correo', 'description' => 'Envío de información, documentación, propuestas o comunicaciones comerciales mediante correo electrónico.'],
            ['name' => '💬 Contacto por WhatsApp', 'description' => 'Comunicación con el prospecto o cliente mediante WhatsApp para atender consultas, brindar información o realizar seguimiento.'],
            ['name' => '📱 Contacto por redes sociales', 'description' => 'Interacción con el prospecto o cliente a través de redes sociales como parte del proceso comercial o de atención.'],
            ['name' => '📋 Solicitud de información', 'description' => 'Solicitud de datos o documentación necesaria para continuar con la evaluación o gestión del prospecto.'],
            ['name' => '📥 Información recibida', 'description' => 'Registro de la recepción de la información o documentación solicitada al prospecto o cliente.'],
            ['name' => '🎯 Calificación de lead', 'description' => 'Evaluación del prospecto para determinar su nivel de interés, potencial comercial y posibilidades de conversión.'],
            ['name' => '👤 Lead no contactado', 'description' => 'Registro de un prospecto con el que aún no se ha logrado establecer comunicación.'],
            ['name' => '✅ Lead contactado', 'description' => 'Registro de que se ha establecido comunicación efectiva con el prospecto.'],
            ['name' => '🧑💼 Presentación comercial', 'description' => 'Presentación de los productos, servicios o soluciones de la empresa al prospecto.'],
            ['name' => '🖥️ Demostración', 'description' => 'Presentación práctica del producto, servicio, plataforma o solución para mostrar su funcionamiento y beneficios.'],
            ['name' => '📄 Envío de propuesta', 'description' => 'Envío de una propuesta comercial elaborada de acuerdo con las necesidades del prospecto.'],
            ['name' => '🔎 Seguimiento de propuesta', 'description' => 'Contacto con el prospecto para conocer el estado de una propuesta enviada, resolver dudas y avanzar hacia el cierre.'],
            ['name' => '🤝 Negociación', 'description' => 'Gestión de conversaciones relacionadas con precios, condiciones, alcance, plazos u otros términos de la propuesta.'],
            ['name' => '📅 Reunión comercial', 'description' => 'Reunión presencial o virtual destinada a conocer necesidades, presentar soluciones o avanzar en una oportunidad comercial.'],
            ['name' => '🗓️ Reunión de seguimiento', 'description' => 'Reunión destinada a revisar avances, resolver pendientes y definir los siguientes pasos del proceso.'],
            ['name' => '📝 Tarea pendiente', 'description' => 'Registro de una actividad que debe realizarse para avanzar con la gestión del prospecto o cliente.'],
            ['name' => '🔔 Recordatorio', 'description' => 'Recordatorio de una acción, contacto o actividad que debe realizarse en una fecha determinada.'],
            ['name' => '⏳ Esperando respuesta', 'description' => 'Registro de una gestión que se encuentra pendiente de respuesta por parte del prospecto o cliente.'],
            ['name' => '⭐ Cliente interesado', 'description' => 'Registro de que el prospecto ha manifestado interés en el producto, servicio o propuesta presentada.'],
            ['name' => '🚫 Cliente no interesado', 'description' => 'Registro de que el prospecto ha indicado que no tiene interés en la propuesta o solución ofrecida.'],
            ['name' => '🧮 Solicitud de cotización', 'description' => 'Registro de una solicitud de precio o cotización realizada por el prospecto o cliente.'],
            ['name' => '🧾 Cotización enviada', 'description' => 'Registro del envío de una cotización con los productos, servicios, precios y condiciones correspondientes.'],
            ['name' => '💳 Pago pendiente', 'description' => 'Registro de un pago pendiente necesario para continuar o completar la operación comercial.'],
            ['name' => '💰 Pago recibido', 'description' => 'Confirmación de la recepción de un pago realizado por el cliente.'],
            ['name' => '🎉 Venta concretada', 'description' => 'Registro de una oportunidad comercial que ha sido cerrada exitosamente y se ha convertido en una venta.'],
            ['name' => '❌ Venta perdida', 'description' => 'Registro de una oportunidad comercial que no llegó a concretarse.'],
            ['name' => '🗑️ Cliente descartado', 'description' => 'Registro de un prospecto que ha sido descartado por criterios comerciales, falta de interés o incompatibilidad con la oferta.'],
            ['name' => '📆 Recontactar posteriormente', 'description' => 'Registro de un próximo contacto para una fecha posterior, de acuerdo con lo coordinado con el prospecto o cliente.'],
            ['name' => '🎧 Solicitud de soporte', 'description' => 'Registro de una solicitud de asistencia o soporte realizada por un cliente.'],
            ['name' => '⚠️ Reclamo', 'description' => 'Registro de una queja, reclamo o incidencia comunicada por el cliente para su atención y seguimiento.'],
            ['name' => '😊 Cliente satisfecho', 'description' => 'Registro de una interacción positiva en la que el cliente manifiesta satisfacción con la atención, producto o servicio recibido.'],
            ['name' => '🔄 Solicitud de renovación', 'description' => 'Registro de una solicitud o necesidad de renovar un contrato, servicio, suscripción o acuerdo comercial.'],
        ];
    }

    public static function createDefaultsForBusiness($businessId): void
    {
        foreach (self::getDefaultProcesses() as $proc) {
            self::firstOrCreate([
                'name' => $proc['name'],
                'business_id' => $businessId,
            ], [
                'description' => $proc['description'],
                'status' => true,
            ]);
        }
    }
}
