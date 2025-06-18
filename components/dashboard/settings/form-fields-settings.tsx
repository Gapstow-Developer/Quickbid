"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface FormFieldsSettingsProps {
  initialSettings: any
  formFields: any[]
}

export function FormFieldsSettings({ initialSettings, formFields }: FormFieldsSettingsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Form Customization</CardTitle>
        <CardDescription>Customize the form fields and their behavior in your calculator.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Form customization features are coming soon. You'll be able to:
          </p>
          <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
            <li>Add or remove form fields</li>
            <li>Set required vs optional fields</li>
            <li>Customize field labels and placeholders</li>
            <li>Reorder form fields</li>
            <li>Add custom validation rules</li>
          </ul>
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Current form fields:</strong> {formFields.length} configured
            </p>
            <p className="text-sm text-blue-600 mt-1">This feature will be available in the next update.</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
