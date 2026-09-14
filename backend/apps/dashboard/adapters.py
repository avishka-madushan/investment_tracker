from allauth.account.adapter import DefaultAccountAdapter

class CustomAccountAdapter(DefaultAccountAdapter):
    def save_user(self, request, user, form, commit=True):
        """
        Intercept the standard email signup to capture the first and last name
        from the request POST data, since they aren't part of the default form.
        """
        user = super().save_user(request, user, form, commit=False)
        
        # Only try to grab them if it's a standard POST request
        if request and hasattr(request, 'POST'):
            first_name = request.POST.get('first_name')
            last_name = request.POST.get('last_name')
            
            if first_name:
                user.first_name = first_name
            if last_name:
                user.last_name = last_name
                
        if commit:
            user.save()
        return user
