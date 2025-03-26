#include <iostream>
using namespace std;

class B;
class A {
private:
    int num;
public:
    void input(int n) {
        num = n;
    }

    bool checkEven() {
        return num % 2 == 0;
    }

    friend class B;
    friend void display(A, B);
};

class B {
public:
    bool checkPrime(A obj) {
        int n = obj.num;
        if (n < 2) return false;
        for (int i = 2; i * i <= n; i++) {
            if (n % i == 0) {
                return false;
            }
        }
        return true;
    }
};

void display(A objA, B objB) {
    if (objA.checkEven())
        cout << objA.num << " is even number" << endl;
    else
        cout << objA.num << " is odd number" << endl;


    if (objB.checkPrime(objA))
        cout << objA.num << " is prime number" << endl;
    else
        cout << objA.num << " is not Prime" << endl;
}

int main() {
    int num;
    cout << "Enter a number: ";
    cin >> num;

    A objA;
    objA.input(num);

    B objB;
    display(objA, objB);

    return 0;
}
