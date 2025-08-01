import BasicRest from "../BasicRest";
import { Fetch } from "sode-extend-react";

class UsersRest extends BasicRest {
    path = 'atalaya/users'

    invite = async (request) => {
        try {
            const { status, result } = await Fetch(`/api/${this.path}/invite`, {
                method: 'POST',
                body: JSON.stringify(request)
            })
            if (!status) throw new Error(result?.message || 'Ocurrio un error inesperado')
            return { status: true, data: result.data }
        } catch (error) {
            return { status: false, message: error.message }
        }
    }
}

export default UsersRest